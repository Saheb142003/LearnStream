// server/src/routes/feed.js
import express from "express";
import Playlist from "../models/playlist.js";

const router = express.Router();

// Mulberry32 seeded RNG
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle using provided rng
const shuffleWithRng = (arr, rng) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      sort = "random",
      limit = 50,
      offset = 0,
      seed = "",
      userShare = "0.05",
    } = req.query;

    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const offsetNum = Math.max(0, parseInt(offset, 10) || 0);
    const ratioMine = Math.max(0, Math.min(1, parseFloat(userShare) || 0.05));

    // determine seed number
    let seedNum;
    if (seed && String(seed).trim()) {
      seedNum = Number(String(seed).slice(0, 12)) || 1;
    } else {
      seedNum = Date.now() & 0xffffffff;
    }
    const rng = mulberry32(seedNum);

    // Fetch playlists from all users that have at least one video
    const playlists = await Playlist.find({ "videos.0": { $exists: true } })
      .select("title videos isSingleVideo createdAt user")
      .populate("user", "name avatar")
      .lean();

    if (!playlists || playlists.length === 0) {
      return res.json({
        success: true,
        videos: [],
        total: 0,
        hasMore: false,
        currentPage: 1,
        totalPages: 0,
        seed: seedNum,
      });
    }

    // Build video entries with uploader metadata
    const allVideos = [];
    playlists.forEach((playlist) => {
      const uploader = playlist.user || {};
      const uploaderIdStr = String(uploader._id || "");
      const uploaderName = uploader.name || "Unknown";
      const uploaderAvatar = uploader.avatar || null;

      (playlist.videos || []).forEach((video) => {
        if (
          video &&
          video.videoId &&
          video.title &&
          !/^private video$/i.test(video.title) &&
          !/^deleted video$/i.test(video.title) &&
          video.videoId.length === 11
        ) {
          allVideos.push({
            videoId: video.videoId,
            title: video.title,
            duration: video.duration || null,
            playlistTitle: playlist.title || "",
            playlistId: playlist._id,
            isSingleVideo: !!playlist.isSingleVideo,
            addedAt: playlist.createdAt,
            thumbnailUrl:
              video.thumbnailUrl ||
              `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
            uploaderId: uploaderIdStr,
            uploaderName,
            uploaderAvatar,
          });
        }
      });
    });

    // No current user (public feed) → treat all videos as "other"
    let filteredVideos = allVideos;

    if (search && search.trim()) {
      const s = search.toLowerCase();
      filteredVideos = filteredVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(s) ||
          (v.playlistTitle || "").toLowerCase().includes(s) ||
          (v.uploaderName || "").toLowerCase().includes(s)
      );
    }

    // Sorting
    const applySort = (arr, sortKey) => {
      if (sortKey === "random") return shuffleWithRng(arr, rng);
      if (sortKey === "title")
        return arr.sort((a, b) => a.title.localeCompare(b.title));
      if (sortKey === "duration")
        return arr.sort(
          (a, b) => parseDuration(b.duration) - parseDuration(a.duration)
        );
      if (sortKey === "playlist")
        return arr.sort((a, b) =>
          (a.playlistTitle || "").localeCompare(b.playlistTitle || "")
        );
      return arr.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    };

    const sortedVideos = applySort(filteredVideos.slice(), sort);

    // Lightweight neighbor swaps for variety
    const swaps = Math.max(0, Math.floor(sortedVideos.length * 0.02));
    for (let s = 0; s < swaps; s++) {
      const i = Math.floor(rng() * sortedVideos.length);
      const j = Math.floor(rng() * sortedVideos.length);
      [sortedVideos[i], sortedVideos[j]] = [sortedVideos[j], sortedVideos[i]];
    }

    // Pagination
    const total = sortedVideos.length;
    const paginated = sortedVideos.slice(offsetNum, offsetNum + limitNum);
    const hasMore = offsetNum + limitNum < total;

    res.json({
      success: true,
      videos: paginated,
      total,
      hasMore,
      currentPage: Math.floor(offsetNum / limitNum) + 1,
      totalPages: Math.ceil(total / limitNum),
      seed: seedNum,
    });
  } catch (error) {
    console.error("Feed fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed data",
    });
  }
});

// Helper to parse "HH:MM:SS" or "MM:SS" into seconds
function parseDuration(duration) {
  if (!duration || typeof duration !== "string") return 0;
  const parts = duration
    .split(":")
    .map(Number)
    .filter((n) => !isNaN(n));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

export default router;
