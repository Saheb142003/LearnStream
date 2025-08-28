// server/src/routes/playerControl/transcript.js
import express from "express";
import { fetchTranscriptText } from "../../services/transcriptService.js";

const router = express.Router();

// Quick validator for YouTube video IDs
const isYouTubeId = (str) => /^[A-Za-z0-9_-]{11}$/.test(str);

/**
 * GET /api/videos/:videoId/transcript?lang=en
 * Response: { videoId, transcript }
 */
router.get("/:videoId/transcript", async (req, res) => {
  const { videoId } = req.params;
  const lang = (req.query.lang || "en").toString();

  if (!isYouTubeId(videoId)) {
    return res.status(400).json({ error: "Invalid YouTube videoId." });
  }

  try {
    const transcript = await fetchTranscriptText(videoId, lang);

    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        error: `Transcript not found for videoId=${videoId} in lang=${lang}`,
      });
    }

    return res.json({ videoId, transcript });
  } catch (e) {
    console.error("Transcript fetch error:", e);

    // More accurate error mapping
    if (e.message?.includes("disabled")) {
      return res.status(403).json({ error: "Transcripts are disabled." });
    }
    if (e.message?.includes("not found")) {
      return res.status(404).json({ error: "Transcript not found." });
    }

    // Default to 500 for unexpected issues
    return res.status(500).json({
      error: "Internal server error while fetching transcript.",
      details: e.message,
    });
  }
});

export default router;
