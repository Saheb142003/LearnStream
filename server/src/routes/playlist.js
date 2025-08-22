import express from "express";
import Playlist from "../models/playlist.js";
import { fetchPlaylistData, fetchVideoData } from "../utils/youtubeService.js";
import { ensureAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(ensureAuth);

/**
 * POST /api/playlists
 * Add a new playlist or single video for logged-in user
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user._id;
    const { playlistId, videoId } = req.body;

    if (!playlistId && !videoId) {
      return res
        .status(400)
        .json({ message: "playlistId or videoId required" });
    }

    let playlistData;

    if (playlistId) {
      playlistData = await fetchPlaylistData(playlistId);
      playlistData.isSingleVideo = false;
    } else if (videoId) {
      const videoInfo = await fetchVideoData(videoId);
      playlistData = {
        playlistId: videoId,
        title: videoInfo.title,
        videos: [videoInfo],
        isSingleVideo: true,
      };
    }

    const newPlaylist = new Playlist({
      user: userId,
      playlistId: playlistData.playlistId,
      title: playlistData.title,
      videos: playlistData.videos,
      isSingleVideo: playlistData.isSingleVideo,
      totalRuntime: playlistData.totalRuntime,
    });

    await newPlaylist.save();
    return res.status(201).json(newPlaylist);
  } catch (err) {
    console.error(err);
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
