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

    // Build mixed entries
    const allItems = [];

    playlists.forEach((playlist) => {
      const uploader = playlist.user || {};
      const uploaderIdStr = String(uploader._id || "");
      const uploaderName = uploader.name || "Unknown";
      const uploaderAvatar = uploader.avatar || null;
      const pVideos = playlist.videos || [];

      // 1. Add the Playlist itself as an item (if it has videos)
      if (pVideos.length > 0 && !playlist.isSingleVideo) {
        // Find a valid thumbnail from the first valid video
        const firstValid = pVideos.find(
          (v) => v && v.videoId && v.videoId.length === 11
        );
        const thumb = firstValid
          ? firstValid.thumbnailUrl ||
            `https://img.youtube.com/vi/${firstValid.videoId}/hqdefault.jpg`
          : "https://via.placeholder.com/320x180?text=Playlist";

        allItems.push({
          type: "playlist",
          playlistId: playlist._id,
          title: playlist.title,
          videoCount: pVideos.length,
          thumbnailUrl: thumb,
          uploaderId: uploaderIdStr,
          uploaderName,
          uploaderAvatar,
          addedAt: playlist.createdAt,
          // For sorting/filtering
          playlistTitle: playlist.title,
        });
      }

      // 2. Add individual videos
      pVideos.forEach((video) => {
        if (
          video &&
          video.videoId &&
          video.title &&
          !/^private video$/i.test(video.title) &&
          !/^deleted video$/i.test(video.title) &&
          video.videoId.length === 11
        ) {
          allItems.push({
            type: "video",
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

    // Filter
    let filteredItems = allItems;
    if (search && search.trim()) {
      const s = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.title.toLowerCase().includes(s) ||
          (item.playlistTitle || "").toLowerCase().includes(s) ||
          (item.uploaderName || "").toLowerCase().includes(s)
      );
    }

    // Sorting
    const applySort = (arr, sortKey) => {
      if (sortKey === "random") return shuffleWithRng(arr, rng);
      if (sortKey === "title")
        return arr.sort((a, b) => a.title.localeCompare(b.title));
      // For duration, playlists don't really have one, so treat as 0 or sum?
      // Let's just keep duration sort for videos mostly, push playlists to end or treat as 0
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

    const sortedItems = applySort(filteredItems.slice(), sort);

    // Lightweight neighbor swaps for variety
    const swaps = Math.max(0, Math.floor(sortedItems.length * 0.02));
    for (let s = 0; s < swaps; s++) {
      const i = Math.floor(rng() * sortedItems.length);
      const j = Math.floor(rng() * sortedItems.length);
      [sortedItems[i], sortedItems[j]] = [sortedItems[j], sortedItems[i]];
    }

    // Pagination
    const total = sortedItems.length;
    const paginated = sortedItems.slice(offsetNum, offsetNum + limitNum);
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
