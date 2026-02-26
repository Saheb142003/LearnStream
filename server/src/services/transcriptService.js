// server/src/services/transcriptService.js
// Production: Supadata.ai transcript API only.
// Full multi-layer version (Python + Invidious + Supadata) kept locally
// in transcriptService.full.js — not committed to GitHub.

import fetch from "node-fetch";

// ─── Configuration ─────────────────────────────────────────────────────────────
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

// ─── Supadata.ai transcript API ───────────────────────────────────────────────
async function fetchFromSupadata(videoId) {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error("SUPADATA_API_KEY not configured");

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en&text=true`,
    {
      headers: {
        "x-api-key": apiKey,
        "User-Agent": "LearnStream/1.0",
      },
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (res.status === 404)
    throw Object.assign(new Error("No transcript available for this video"), {
      code: "NOT_FOUND",
    });
  if (res.status === 403)
    throw Object.assign(new Error("Video is private or age-restricted"), {
      code: "FORBIDDEN",
    });
  if (!res.ok) throw new Error(`Supadata responded ${res.status}`);

  const data = await res.json();

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

// ─── Public API ───────────────────────────────────────────────────────────────
export async function fetchTranscriptText(videoId, lang = "en") {
  const key = `${videoId}:${lang}`;

  const cached = cacheGet(key);
  if (cached) return cached;

  if (IN_FLIGHT.has(key)) return IN_FLIGHT.get(key);

  const promise = fetchFromSupadata(videoId).then(
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
    provider: "supadata",
  };
}
