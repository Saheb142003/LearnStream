// frontend/src/components/VideoItem.jsx
export default function VideoItem({ video }) {
  if (
    !video ||
    !video.title ||
    video.title.toLowerCase() === "private video" ||
    video.title.toLowerCase() === "deleted video"
  ) {
    return null; // 🚫 skip invalid entries
  }

  const getThumbnailUrl = () => {
    // ✅ Case 1: single video
    if (video.isSingleVideo && video.videoId) {
      return `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
    }

    // ✅ Case 2: playlist (take first video’s thumbnail)
    if (!video.isSingleVideo && video.videos?.length > 0) {
      return `https://img.youtube.com/vi/${video.videos[0].videoId}/hqdefault.jpg`;
    }

    // ✅ Fallback
    return "https://via.placeholder.com/320x180?text=No+Image";
  };

  const getDisplayInfo = () => {
    // ✅ Single video
    if (video.isSingleVideo) {
      return {
        duration: video.duration || null,
        isPlaylist: false,
      };
    }

    // ✅ Playlist
    if (!video.isSingleVideo && video.videos?.length > 0) {
      return {
        duration: video.totalRuntime || "0m", // safe fallback
        isPlaylist: true,
        count: video.videos.length,
      };
    }

    return { duration: null, isPlaylist: false };
  };

  const thumbnail = getThumbnailUrl();
  const title = video.title || "Untitled";
  const displayInfo = getDisplayInfo();

  return (
    <div className="relative group">
      <div className="relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-44 object-cover rounded-md mb-3 shadow-sm"
          onError={(e) => {
            if (e.target.src.includes("hqdefault")) {
              e.target.src = e.target.src.replace("hqdefault", "mqdefault");
            } else if (e.target.src.includes("mqdefault")) {
              e.target.src =
                "https://via.placeholder.com/320x180?text=No+Image";
            }
          }}
        />

        {/* Duration overlay (only for single videos) */}
        {displayInfo.duration && !displayInfo.isPlaylist && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-90 text-white text-xs font-semibold px-2 py-1 rounded">
            {displayInfo.duration}
          </div>
        )}

        {/* Playlist badge (count) */}
        {displayInfo.isPlaylist && displayInfo.count > 0 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-90 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            {displayInfo.count}
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-base font-semibold text-gray-800 truncate"
        title={title}
      >
        {title}
      </h3>

      {/* Playlist extra info */}
      {displayInfo.isPlaylist && (
        <p className="text-xs text-gray-500 mt-1">
          {displayInfo.count || 0} videos • {displayInfo.duration || "0m"} total
        </p>
      )}
    </div>
  );
}
