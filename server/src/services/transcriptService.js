// server/src/services/transcriptService.js
//
// Transcript engine — 3 layers:
//   Layer 1 — Python youtube_transcript_api (primary, supports cookies for cloud IPs)
//   Layer 2 — Invidious public mirrors (parallel race, not serial)
//   Layer 3 — Supadata.ai transcript API (set SUPADATA_API_KEY in env)
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
  CACHE.set(key, value);
  return value;
}

function cacheSet(key, value) {
  if (CACHE.size >= CACHE_MAX_SIZE) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, value);
}

// ─── In-flight deduplication ───────────────────────────────────────────────────
const IN_FLIGHT = new Map();

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
// Set YOUTUBE_COOKIES_TXT env var on Render to bypass cloud IP blocks.
// See fetch_transcript.py for instructions on getting cookies.
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

// ─── Layer 2: Invidious public API — parallel race ─────────────────────────────
// Runs all instances concurrently and returns the first success.
// This avoids the 96-second worst-case serial timeout.
const INVIDIOUS_INSTANCES = [
  "https://iv.datura.network",
  "https://invidious.privacydev.net",
  "https://invidious.flokinet.to",
  "https://yt.cdaut.de",
  "https://invidious.perennialte.ch",
  "https://yewtu.be",
  "https://inv.tux.pizza",
  "https://invidious.drgns.space",
  "https://invidious.nerdvpn.de",
  "https://iv.melmac.space",
  "https://invidious.privacyredirect.com",
  "https://invidious.jing.rocks",
  "https://invidious.lunar.icu",
  "https://invidious.reallyaweso.me",
];

const INVIDIOUS_TIMEOUT_MS = 6_000;

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

async function tryOneInvidious(instance, videoId, lang) {
  const captRes = await fetch(`${instance}/api/v1/captions/${videoId}`, {
    signal: AbortSignal.timeout(INVIDIOUS_TIMEOUT_MS),
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!captRes.ok) throw new Error(`${instance} captions ${captRes.status}`);

  const data = await captRes.json();
  const captions = Array.isArray(data.captions) ? data.captions : [];
  if (!captions.length) throw new Error(`${instance} no captions`);

  const track =
    captions.find((c) => c.languageCode === lang) ||
    captions.find((c) => c.languageCode?.startsWith("en")) ||
    captions[0];
  if (!track?.url) throw new Error(`${instance} no track url`);

  // track.url is a relative path like /api/v1/captions/...?label=...
  const vttUrl = track.url.startsWith("http")
    ? track.url
    : `${instance}${track.url}`;
  const trackRes = await fetch(vttUrl, {
    signal: AbortSignal.timeout(INVIDIOUS_TIMEOUT_MS),
  });
  if (!trackRes.ok) throw new Error(`${instance} vtt ${trackRes.status}`);

  const vttText = await trackRes.text();
  if (!vttText || vttText.length < 50)
    throw new Error(`${instance} vtt too short`);

  const text = parseVtt(vttText);
  if (!text || text.length < 50)
    throw new Error(`${instance} parsed text too short`);

  return text;
}

async function layer2_invidious(videoId, lang) {
  // Race all instances — first non-rejected result wins
  return new Promise((resolve, reject) => {
    let settled = false;
    let failures = 0;
    const total = INVIDIOUS_INSTANCES.length;

    for (const instance of INVIDIOUS_INSTANCES) {
      tryOneInvidious(instance, videoId, lang).then(
        (text) => {
          if (!settled) {
            settled = true;
            resolve(text);
          }
        },
        () => {
          failures++;
          if (failures === total && !settled) {
            settled = true;
            reject(new Error("All Invidious instances failed"));
          }
        },
      );
    }
  });
}

// ─── Layer 3: Supadata.ai transcript API ──────────────────────────────────────
// Free tier: 100 requests/month
// Set SUPADATA_API_KEY in Render environment to enable.
// Get key at: https://supadata.ai
async function layer3_supadata(videoId) {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error("SUPADATA_API_KEY not set");

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en&text=true`,
    {
      headers: {
        "x-api-key": apiKey,
        "User-Agent": "LearnStream/1.0",
      },
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!res.ok) throw new Error(`Supadata responded ${res.status}`);

  const data = await res.json();

  // Supadata returns { content, lang } where content is plain text, or
  // { segments: [{text, start, duration}] } depending on ?text=true
  const text =
    typeof data.content === "string"
      ? data.content
      : Array.isArray(data.segments)
        ? data.segments.map((s) => s.text).join(" ")
        : null;

  if (!text || text.length < 30)
    throw new Error("Supadata returned empty transcript");
  return cleanText(text);
}

// ─── Core fetch (runs once per unique key) ────────────────────────────────────
async function doFetch(videoId, lang) {
  await acquire();
  try {
    // Layer 1: Python
    try {
      return await layer1_python(videoId, lang);
    } catch (e1) {
      console.warn(`[Transcript] L1 failed for ${videoId}: ${e1.message}`);
    }

    // Layer 2: Invidious (parallel race)
    try {
      return await layer2_invidious(videoId, lang);
    } catch (e2) {
      console.warn(`[Transcript] L2 failed for ${videoId}: ${e2.message}`);
    }

    // Layer 3: Supadata
    return await layer3_supadata(videoId);
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
