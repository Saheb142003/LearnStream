// server/src/services/transcriptService.js
import { YoutubeTranscript } from "youtube-transcript";
import { runPython } from "../utils/runPython.js";

const CACHE = new Map();

export async function fetchTranscriptText(videoId, lang = "en") {
  const key = `${videoId}:${lang}`;
  if (CACHE.has(key)) return CACHE.get(key);

  // 1) Primary: node library
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId, { lang });
    if (Array.isArray(items) && items.length > 0) {
      const text = items
        .map((i) => i.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      CACHE.set(key, text);
      return text;
    }
  } catch (e) {
    // swallow and try python fallback next
  }

  // 2) Fallback: python youtube_transcript_api (very reliable)
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    // Try multiple language preferences; you can pass req.query.langs="en,en-IN,hi"
    const langsCSV = process.env.TRANSCRIPT_LANGS || "en,en-US,en-GB,en-IN,hi";
    const { stdout } = await runPython("fetch_transcript.py", [url, langsCSV]);

    let data;
    try {
      data = JSON.parse(stdout);
    } catch (err) {
      throw new Error(
        "Transcript fetch failed (Python returned invalid JSON)."
      );
    }

    if (Array.isArray(data) && data.length > 0) {
      const text = data.join(" ").replace(/\s+/g, " ").trim();
      CACHE.set(key, text);
      return text;
    }

    if (data && data.error) {
      throw new Error(data.error);
    }

    throw new Error("Transcript not available.");
  } catch (err) {
    // final error
    const msg = err?.message || "Transcript not available.";
    throw new Error(msg);
  }
}
