// server/src/routes/playerControl/transcript.js
import express from "express";
import ytdl from "@distube/ytdl-core";
import {
  fetchTranscriptText,
  getTranscriptStats,
} from "../../services/transcriptService.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import VideoCache from "../../models/videoCache.js";

const router = express.Router();

// ─── Validators ───────────────────────────────────────────────────────────────
const isYouTubeId = (s) => /^[A-Za-z0-9_-]{11}$/.test(s);
const isValidLang = (s) => /^[a-z]{2}(-[A-Z]{2})?$/.test(s); // e.g. "en", "en-US"

// ─── Rate limiter — transcript is the expensive endpoint ─────────────────────
const transcriptRateLimit = createRateLimiter({
  ipMax: 10, // 10 requests / minute per IP
  ipWindow: 60_000,
  userMax: 25, // 25 requests / 5 minutes per authenticated user
  userWindow: 300_000,
  resource: "the transcript API",
});

// ─── Error classifier ─────────────────────────────────────────────────────────
function classifyError(e) {
  const msg = (e?.message || "").toLowerCase();

  if (e?.code === "QUEUE_FULL")
    return {
      status: 503,
      error: "Server is busy. Please try again in a few seconds.",
      retryable: true,
    };
  // AbortController abort (timeout) produces name="AbortError" or name="TimeoutError"
  if (
    e?.name === "AbortError" ||
    e?.name === "TimeoutError" ||
    e?.code === "TIMEOUT" ||
    msg.includes("aborted") ||
    msg.includes("timed out")
  )
    return {
      status: 504,
      error: "Transcript fetch timed out. Please try again.",
      retryable: true,
    };
  if (msg.includes("disabled"))
    return { status: 403, error: "Transcripts are disabled for this video." };
  if (msg.includes("no transcript found"))
    return {
      status: 404,
      error: "No transcript found. The video may not have captions.",
    };
  if (msg.includes("unavailable"))
    return { status: 404, error: "Video or transcript is unavailable." };
  if (msg.includes("age-restricted"))
    return {
      status: 403,
      error:
        "This video is age-restricted and its transcript cannot be fetched.",
    };
  if (msg.includes("private"))
    return { status: 403, error: "This is a private video." };

  return {
    status: 500,
    error: "Could not fetch transcript.",
    details: e?.message,
  };
}

/**
 * GET /api/videos/:videoId/transcript?lang=en
 * Returns { videoId, transcript }
 */
router.get("/:videoId/transcript", transcriptRateLimit, async (req, res) => {
  const { videoId } = req.params;
  const lang = isValidLang(req.query.lang?.toString() || "")
    ? req.query.lang.toString()
    : "en";

  if (!isYouTubeId(videoId)) {
    return res.status(400).json({ error: "Invalid YouTube videoId." });
  }

  try {
    // 1. Check MongoDB cache first
    const cached = await VideoCache.findOne({ videoId });
    if (cached && cached.transcript) {
      res.set("Cache-Control", "public, max-age=3600");
      return res.json({ videoId, transcript: cached.transcript, lang });
    }

    // 2. Fetch transcript
    const transcript = await fetchTranscriptText(videoId, lang);

    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        error: `No transcript content for videoId=${videoId} (lang=${lang})`,
      });
    }

    // 3. Cache it in MongoDB
    await VideoCache.findOneAndUpdate(
      { videoId },
      { $set: { transcript } },
      { upsert: true, new: true }
    );

    // Cache-Control: 1 hour — transcript content is stable
    res.set("Cache-Control", "public, max-age=3600");
    return res.json({ videoId, transcript, lang });
  } catch (e) {
    console.error(`[/transcript] ${videoId}:`, e.message);
    const { status, error, details, retryable } = classifyError(e);

    const body = { error };
    if (details) body.details = details;
    if (retryable) body.retryable = true;

    if (status === 503 || status === 504) {
      res.set("Retry-After", "5");
    }

    return res.status(status).json(body);
  }
});

/**
 * GET /api/videos/:videoId/details
 * Returns { videoId, title, author, lengthSeconds, thumbnails }
 */
router.get("/:videoId/details", async (req, res) => {
  const { videoId } = req.params;

  if (!isYouTubeId(videoId)) {
    return res.status(400).json({ error: "Invalid YouTube videoId." });
  }

  try {
    // Check MongoDB cache first
    let cached = await VideoCache.findOne({ videoId });
    if (cached && cached.title) {
      return res.json({
        videoId,
        title: cached.title,
        thumbnailUrl: cached.thumbnailUrl,
        description: cached.description || "",
      });
    }

    const info = await ytdl.getBasicInfo(videoId);
    const details = info.videoDetails;
    const title = details.title;
    const description = details.description || details.shortDescription || "";
    const thumbnailUrl = details.thumbnails?.[details.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Cache details in MongoDB
    await VideoCache.findOneAndUpdate(
      { videoId },
      { $set: { title, thumbnailUrl, description } },
      { upsert: true, new: true }
    );

    return res.json({
      videoId,
      title,
      author: details.author.name,
      lengthSeconds: details.lengthSeconds,
      thumbnails: details.thumbnails,
      thumbnailUrl,
      description,
    });
  } catch (e) {
    console.error(`[/details] ${videoId}:`, e.message);
    return res
      .status(500)
      .json({ error: "Failed to fetch video details.", details: e.message });
  }
});

/**
 * GET /api/videos/stats
 * Internal diagnostics — transcript service health snapshot.
 * Useful for monitoring dashboards or a future /health endpoint.
 */
router.get("/stats", (req, res) => {
  return res.json(getTranscriptStats());
});

export default router;
