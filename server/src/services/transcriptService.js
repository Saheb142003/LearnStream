// server/src/services/transcriptService.js
//
// Transcript engine:
//   Layer 1 — Python youtube_transcript_api (primary)
//   Layer 2 — Invidious public mirrors (fallback)
//
// Scalability:
//   • LRU cache (200 entries)
//   • In-flight deduplication — same video:lang Promise shared across callers
//   • Concurrency semaphore — caps simultaneous Python processes
//   • Queue with backpressure — 503 when queue is full
//   • Per-process timeout with SIGTERM → SIGKILL escalation

import { runPython } from "../utils/runPython.js";
import fetch from "node-fetch";

// ─── Configuration ─────────────────────────────────────────────────────────────
const MAX_CONCURRENT = Number(process.env.TRANSCRIPT_CONCURRENCY ?? 3);
const MAX_QUEUE_DEPTH = Number(process.env.TRANSCRIPT_QUEUE_DEPTH ?? 20);
const TIMEOUT_MS = Number(process.env.TRANSCRIPT_TIMEOUT_MS ?? 30_000);
const CACHE_MAX_SIZE = 200;

// ─── LRU cache ─────────────────────────────────────────────────────────────────
const CACHE = new Map();

function cacheGet(key) {
  if (!CACHE.has(key)) return null;
  const value = CACHE.get(key);
  CACHE.delete(key);
  CACHE.set(key, value); // re-insert = promote to newest
  return value;
}

function cacheSet(key, value) {
  if (CACHE.size >= CACHE_MAX_SIZE) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, value);
}

// ─── In-flight deduplication ───────────────────────────────────────────────────
const IN_FLIGHT = new Map(); // key → Promise<string>

// ─── Concurrency semaphore ─────────────────────────────────────────────────────
let activeCount = 0;
const waitQueue = [];

function acquire() {
  return new Promise((resolve, reject) => {
    if (activeCount < MAX_CONCURRENT) {
      activeCount++;
      resolve();
    } else if (waitQueue.length >= MAX_QUEUE_DEPTH) {
      reject(
        Object.assign(
          new Error(
            `Server is busy: transcript queue is full (limit ${MAX_QUEUE_DEPTH}). Please try again shortly.`,
          ),
          { code: "QUEUE_FULL" },
        ),
      );
    } else {
      waitQueue.push({ resolve, reject });
    }
  });
}

function release() {
  if (waitQueue.length > 0) {
    waitQueue.shift().resolve();
  } else {
    activeCount--;
  }
}

// ─── Text cleaner ──────────────────────────────────────────────────────────────
function cleanText(raw) {
  return (raw || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "")
    .replace(/\[Music\]/gi, "")
    .replace(/\[Applause\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Layer 1: Python youtube_transcript_api ────────────────────────────────────
async function layer1_python(videoId, lang) {
  const langCodes = [lang, "en", "en-US", "en-GB", "en-IN"]
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .join(",");

  const { stdout } = await runPython(
    "fetch_transcript.py",
    [videoId, langCodes],
    TIMEOUT_MS,
  );

  const trimmed = stdout.trim();
  if (!trimmed) throw new Error("Python script returned empty output");

  const parsed = JSON.parse(trimmed);
  if (parsed?.error) throw new Error(parsed.error);
  if (!Array.isArray(parsed) || parsed.length === 0)
    throw new Error("No transcript segments returned");

  const text = parsed.map((s) => cleanText(s.text)).join(" ");
  if (text.length < 30) throw new Error("Transcript text too short");

  return text;
}

// ─── Layer 2: Invidious public API ─────────────────────────────────────────────
const INVIDIOUS_INSTANCES = [
  "https://invidious.drgns.space",
  "https://inv.bp.projectsegfau.lt",
  "https://invidious.flokinet.to",
  "https://invidious.privacydev.net",
  "https://yewtu.be",
  "https://invidious.nerdvpn.de",
  "https://inv.tux.pizza",
  "https://invidious.nzgraham.com",
  "https://inv.zzls.xyz",
];

function parseVtt(vttText) {
  const lines = vttText.split("\n");
  const texts = [];
  let inCue = false;

  for (const line of lines) {
    const t = line.trim();
    if (t.includes("-->")) {
      inCue = true;
      continue;
    }
    if (!t) {
      inCue = false;
      continue;
    }
    if (inCue && !/^\d+$/.test(t) && !t.startsWith("WEBVTT")) {
      texts.push(t.replace(/<[^>]+>/g, ""));
    }
  }

  return cleanText(texts.join(" "));
}

async function layer2_invidious(videoId, lang) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const captRes = await fetch(`${instance}/api/v1/captions/${videoId}`, {
        signal: AbortSignal.timeout(8_000),
      });
      if (!captRes.ok) continue;

      const data = await captRes.json();
      const captions = Array.isArray(data.captions) ? data.captions : [];
      if (!captions.length) continue;

      const track =
        captions.find((c) => c.languageCode === lang) ||
        captions.find((c) => c.languageCode?.startsWith("en")) ||
        captions[0];
      if (!track?.url) continue;

      const trackRes = await fetch(instance + track.url, {
        signal: AbortSignal.timeout(8_000),
      });
      if (!trackRes.ok) continue;

      const vttText = await trackRes.text();
      if (!vttText || vttText.length < 50) continue;

      const text = parseVtt(vttText);
      if (text && text.length > 50) return text;
    } catch {
      // instance down — try next
    }
  }

  throw new Error("All Invidious instances failed");
}

// ─── Core fetch (runs once per unique key) ────────────────────────────────────
async function doFetch(videoId, lang) {
  await acquire();
  try {
    try {
      return await layer1_python(videoId, lang);
    } catch (e1) {
      console.warn(`[Transcript] Primary failed for ${videoId}: ${e1.message}`);
    }
    return await layer2_invidious(videoId, lang);
  } finally {
    release();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function fetchTranscriptText(videoId, lang = "en") {
  const key = `${videoId}:${lang}`;

  const cached = cacheGet(key);
  if (cached) return cached;

  if (IN_FLIGHT.has(key)) return IN_FLIGHT.get(key);

  const promise = doFetch(videoId, lang).then(
    (text) => {
      cacheSet(key, text);
      IN_FLIGHT.delete(key);
      return text;
    },
    (err) => {
      IN_FLIGHT.delete(key);
      throw err;
    },
  );

  IN_FLIGHT.set(key, promise);
  return promise;
}

export function getTranscriptStats() {
  return {
    cacheSize: CACHE.size,
    cacheCapacity: CACHE_MAX_SIZE,
    inFlightCount: IN_FLIGHT.size,
    activeWorkers: activeCount,
    queuedRequests: waitQueue.length,
    maxConcurrent: MAX_CONCURRENT,
    maxQueueDepth: MAX_QUEUE_DEPTH,
  };
}
