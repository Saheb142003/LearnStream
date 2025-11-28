// server/src/services/transcriptService.js
import { YoutubeTranscript } from "youtube-transcript";
import { runPython } from "../utils/runPython.js";
import fetch from "node-fetch";

// Simple memory cache with size limit to prevent leaks
const CACHE_LIMIT = 100;
const CACHE = new Map();

// Cache for healthy instances
let HEALTHY_INSTANCES = [];
let LAST_INSTANCE_FETCH = 0;
const INSTANCE_CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getFromCache(key) {
  return CACHE.get(key);
}

function setInCache(key, value) {
  if (CACHE.size >= CACHE_LIMIT) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, value);
}

async function getHealthyInstances() {
  const now = Date.now();
  if (HEALTHY_INSTANCES.length > 0 && now - LAST_INSTANCE_FETCH < INSTANCE_CACHE_TTL) {
    return HEALTHY_INSTANCES;
  }

  try {
    const res = await fetch("https://api.invidious.io/instances.json?sort_by=health", { timeout: 3000 });
    if (!res.ok) throw new Error("Failed to fetch instances");
    
    const data = await res.json();
    const instances = data
      .filter(item => {
        const [domain, meta] = item;
        return meta.type === "https"; // Relaxed filter: just HTTPS
      })
      .map(item => item[0])
      .slice(0, 8); // Take top 8 healthy instances

    if (instances.length > 0) {
      HEALTHY_INSTANCES = instances;
      LAST_INSTANCE_FETCH = now;
      return instances;
    }
  } catch (e) {
    console.error("Failed to update Invidious instances:", e.message);
  }

  // Fallback hardcoded list if API fails
  if (HEALTHY_INSTANCES.length === 0) {
    return [
      "inv.nadeko.net",
      "yewtu.be",
      "inv.perditum.com",
      "invidious.nerdvpn.de",
      "invidious.f5.si",
      "inv.tux.pizza",
      "vid.puffyan.us"
    ];
  }
  
  return HEALTHY_INSTANCES;
}

// Helper for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchInvidiousTranscript(videoId) {
  const instances = await getHealthyInstances();
  
  // Add some reliable hardcoded fallbacks to the end of the list
  const allInstances = [
    ...instances,
    "https://inv.nadeko.net",
    "https://yewtu.be",
    "https://inv.tux.pizza"
  ];

  // Deduplicate
  const uniqueInstances = [...new Set(allInstances)];

  for (const domain of uniqueInstances) {
    // Handle both full URLs and domains
    const instance = domain.startsWith('http') ? domain : `https://${domain}`;
    
    try {
      // console.log(`Trying Invidious instance: ${instance}`);
      const url = `${instance}/api/v1/captions/${videoId}`;
      
      // Increased timeout for data center latency
      const res = await fetch(url, { timeout: 8000 });
      if (!res.ok) continue;

      const data = await res.json();
      const captions = data.captions || [];
      if (captions.length === 0) continue;

      // Prioritize English
      const track = captions.find(c => c.languageCode === 'en') || captions[0];
      const trackUrl = instance + track.url;

      const trackRes = await fetch(trackUrl, { timeout: 8000 });
      if (!trackRes.ok) continue;

      const vttText = await trackRes.text();
      
      // Simple VTT parser
      const lines = vttText.split('\n');
      let text = "";
      let seen = new Set();

      for (let line of lines) {
        line = line.trim();
        // Skip empty, header, timestamps, numbers, and metadata
        if (!line || 
            line.includes('-->') || 
            /^\d+$/.test(line) || 
            line.startsWith('WEBVTT') || 
            line.startsWith('Kind:') || 
            line.startsWith('Language:') ||
            line.startsWith('Style:')
        ) continue;
        
        const cleanLine = line.replace(/<[^>]*>/g, '').trim();
        if (cleanLine && !seen.has(cleanLine)) {
          text += cleanLine + " ";
          seen.add(cleanLine);
        }
      }
      
      return text.trim();

    } catch (e) {
      // console.warn(`Invidious instance ${instance} failed: ${e.message}`);
      // Small delay before next attempt to be nice
      await delay(500);
      continue;
    }
  }
  throw new Error("All Invidious instances failed.");
}

export async function fetchTranscriptText(videoId, lang = "en") {
  const key = `${videoId}:${lang}`;
  const cached = getFromCache(key);
  if (cached) return cached;

  let errors = [];

  // 1) Primary: node library
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId, { lang });
    if (Array.isArray(items) && items.length > 0) {
      const text = items
        .map((i) => i.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      setInCache(key, text);
      return text;
    }
  } catch (e) {
    errors.push(`Node lib: ${e.message}`);
  }

  // 2) Fallback: python youtube_transcript_api
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const langsCSV = process.env.TRANSCRIPT_LANGS || "en,en-US,en-GB,en-IN,hi";
    const { stdout } = await runPython("fetch_transcript.py", [url, langsCSV]);

    let data;
    try {
      data = JSON.parse(stdout);
    } catch (err) {
      throw new Error("Python returned invalid JSON");
    }

    if (Array.isArray(data) && data.length > 0) {
      const text = data
        .map(item => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      setInCache(key, text);
      return text;
    }
    if (data && data.error) throw new Error(data.error);
  } catch (err) {
    errors.push(`Python lib: ${err.message}`);
  }

  // 3) Final Fallback: Invidious API (Dynamic)
  try {
    const text = await fetchInvidiousTranscript(videoId);
    if (text) {
      setInCache(key, text);
      return text;
    }
  } catch (e) {
    errors.push(`Invidious: ${e.message}`);
  }

  console.error(`Transcript fetch failed for ${videoId}. Errors:`, errors);
  throw new Error("Transcript not available (all sources failed).");
}
