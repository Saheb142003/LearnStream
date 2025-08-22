// server/src/utils/youtubeService.js
import fetch from "node-fetch";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const API_BASE = "https://www.googleapis.com/youtube/v3";

if (!YOUTUBE_API_KEY) {
  throw new Error("❌ Missing YOUTUBE_API_KEY in environment variables");
}

// --- Parse ISO 8601 duration to H:MM:SS or M:SS
function parseYouTubeDuration(isoDuration) {
  if (!isoDuration) return "0:00";

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Convert duration string ("1:23:45", "4:13") to seconds
function durationToSeconds(duration) {
  if (!duration || duration === "0:00") return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// Convert seconds -> "1h 23m" format
function secondsToHumanFormat(totalSeconds) {
  if (totalSeconds === 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

async function fetchVideoDurations(videoIds) {
  if (!videoIds.length) return {};

  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const durationMap = {};

  for (const chunk of chunks) {
    try {
      const videoRes = await fetch(
        `${API_BASE}/videos?part=contentDetails&id=${chunk.join(
          ","
        )}&key=${YOUTUBE_API_KEY}`
      );
      const videoData = await videoRes.json();

      if (videoData.items) {
        videoData.items.forEach((item) => {
          const duration = parseYouTubeDuration(item.contentDetails.duration);
          durationMap[item.id] = duration;
        });
      }
    } catch (error) {
      console.error("❌ Error fetching durations:", error);
    }
  }

  return durationMap;
}

export async function fetchPlaylistData(playlistId) {
  // fetch playlist title
  const playlistRes = await fetch(
    `${API_BASE}/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`
  );
  const playlistData = await playlistRes.json();

  if (!playlistData.items || playlistData.items.length === 0) {
    throw new Error("Playlist not found");
  }

  const playlistTitle = playlistData.items[0].snippet.title;

  let allVideos = [];
  let nextPageToken = "";

  // fetch all videos
  do {
    const videosRes = await fetch(
      `${API_BASE}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${
        nextPageToken ? `&pageToken=${nextPageToken}` : ""
      }&key=${YOUTUBE_API_KEY}`
    );
    const videosData = await videosRes.json();

    if (!videosData.items) {
      throw new Error("Failed to fetch playlist videos");
    }

    const videos = videosData.items
      .map((item) => ({
        videoId: item.snippet?.resourceId?.videoId,
        title: item.snippet?.title,
      }))
      // 🚫 Remove private/deleted
      .filter(
        (video) =>
          video.videoId &&
          video.title &&
          video.title.toLowerCase() !== "private video" &&
          video.title.toLowerCase() !== "deleted video"
      );

    allVideos = [...allVideos, ...videos];
    nextPageToken = videosData.nextPageToken || "";
  } while (nextPageToken);

  // fetch durations for all videos
  const videoIds = allVideos.map((video) => video.videoId);
  const durationMap = await fetchVideoDurations(videoIds);

  let totalSeconds = 0;

  const videosWithDurations = allVideos.map((video) => {
    const duration = durationMap[video.videoId] || "0:00";
    totalSeconds += durationToSeconds(duration);
    return { ...video, duration };
  });

  return {
    playlistId,
    title: playlistTitle,
    totalRuntime: secondsToHumanFormat(totalSeconds), // ✅ Playlist total time
    videos: videosWithDurations,
    isSingleVideo: false,
  };
}

export async function fetchVideoData(videoId) {
  const videoRes = await fetch(
    `${API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
  );
  const videoData = await videoRes.json();

  if (!videoData.items || videoData.items.length === 0) {
    throw new Error("Video not found");
  }

  const video = videoData.items[0];
  const duration = parseYouTubeDuration(video.contentDetails.duration);

  return {
    videoId,
    title: video.snippet.title,
    duration,
    isSingleVideo: true,
  };
}
