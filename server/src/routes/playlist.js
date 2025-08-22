// server/src/routes/playlist.js
import express from "express";
import Playlist from "../models/playlist.js";
import { fetchPlaylistData, fetchVideoData } from "../utils/youtubeService.js";
import { ensureAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(ensureAuth);

/* ----------------------------- helpers ------------------------------ */
function extractVideoId(url = "") {
  if (!url) return null;
  try {
    // youtu.be/<id>
    const short = url.match(/youtu\.be\/([\w-]{11})/);
    if (short) return short[1];

    // youtube.com/watch?v=<id>
    const vParam = url.match(/[?&]v=([\w-]{11})/);
    if (vParam) return vParam[1];

    // youtube.com/embed/<id>
    const embed = url.match(/\/embed\/([\w-]{11})/);
    if (embed) return embed[1];

    // youtube.com/shorts/<id>
    const shorts = url.match(/\/shorts\/([\w-]{11})/);
    if (shorts) return shorts[1];

    return null;
  } catch {
    return null;
  }
}

function extractPlaylistId(url = "") {
  if (!url) return null;
  try {
    const listParam = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return listParam ? listParam[1] : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/playlists
 * Accepts: { url? , playlistId?, videoId? }
 * Creates (or returns existing) entry for either a playlist or a single video.
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user._id;
    let { url, playlistId, videoId } = req.body || {};

    // Accept a raw URL too
    if (url) {
      const p = extractPlaylistId(url);
      const v = extractVideoId(url);
      playlistId = playlistId || p || null;
      videoId = videoId || (!p && v ? v : null); // if playlist present prefer playlist; else use video
    }

    if (!playlistId && !videoId) {
      return res
        .status(400)
        .json({
          message: "Provide either a YouTube playlist or video URL/ID.",
        });
    }

    let canonicalKey;
    let payload;

    if (playlistId) {
      // Check if already saved for this user
      canonicalKey = playlistId; // keyed by playlist id
      const existing = await Playlist.findOne({
        user: userId,
        playlistId: canonicalKey,
      });
      if (existing) return res.status(200).json(existing);

      const data = await fetchPlaylistData(playlistId);
      payload = {
        user: userId,
        playlistId: data.playlistId,
        title: data.title,
        videos: data.videos,
        isSingleVideo: false,
        totalRuntime: data.totalRuntime || null,
      };
    } else {
      // single video entry
      canonicalKey = videoId; // key by video id
      const existing = await Playlist.findOne({
        user: userId,
        playlistId: canonicalKey,
      });
      if (existing) return res.status(200).json(existing);

      const videoInfo = await fetchVideoData(videoId);
      payload = {
        user: userId,
        playlistId: videoId, // keep the same shape in your schema
        title: videoInfo.title,
        videos: [videoInfo],
        isSingleVideo: true,
        totalRuntime: videoInfo.duration || null,
      };
    }

    const created = await new Playlist(payload).save();
    return res.status(201).json(created);
  } catch (err) {
    console.error("Create playlist/video error:", err);
    // ensureAuth will already send 401 when not authed; if it reaches here it’s server error
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/**
 * GET /api/playlists
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user._id;
    const playlists = await Playlist.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.json(playlists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch playlists" });
  }
});

/**
 * GET /api/playlists/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      user: userId,
    });
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });
    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch playlist details" });
  }
});

/**
 * DELETE /api/playlists/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const playlist = await Playlist.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });
    res.json({ message: "Playlist removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete playlist" });
  }
});

export default router;
