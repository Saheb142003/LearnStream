// frontend/src/pages/Feed/VideoCard.jsx
import { useState } from "react";

export default function VideoCard({ video, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  // Thumbnails preference
  const serverThumb = video.thumbnailUrl || "";
  const defaultThumb = `https://img.youtube.com/vi/${video.videoId}/default.jpg`; // very small & fast
  const mq = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
  const hq = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
  const placeholder = "https://via.placeholder.com/320x180?text=No+Image";

  const handleImageError = (e) => {
    const src = e.currentTarget.src || "";
    if (src === serverThumb && hq) {
      e.currentTarget.src = hq;
    } else if (src.includes("hqdefault")) {
      e.currentTarget.src = mq;
    } else if (src.includes("mqdefault")) {
      e.currentTarget.src = placeholder;
    } else {
      e.currentTarget.src = placeholder;
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return null;
    return duration.trim();
  };

  const truncateTitle = (title, maxLength = 60) => {
    if (!title) return "";
    return title.length <= maxLength
      ? title
      : title.substring(0, maxLength) + "...";
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div
      className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail wrapper */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {/* super lightweight preview */}
        <img
          src={defaultThumb}
          alt={video.title || "Video thumbnail"}
          className="absolute inset-0 w-full h-full object-cover object-center blur-sm scale-105"
          loading="lazy"
          decoding="async"
        />
        {/* higher-quality thumbnail */}
        <img
          src={serverThumb || hq}
          alt={video.title || "Video thumbnail"}
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />

        {/* Duration overlay */}
        {formatDuration(video.duration) && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs font-semibold px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            isHovered ? "bg-black/10" : "bg-black/0"
          }`}
        />
        {/* Play icon */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-red-600 text-white rounded-full p-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3
          className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors"
          title={video.title}
        >
          {truncateTitle(video.title)}
        </h3>

        {/* Metadata: uploader */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar or initials */}
            {video.uploaderAvatar ? (
              <img
                src={video.uploaderAvatar}
                alt={video.uploaderName || "Uploader"}
                className="w-7 h-7 rounded-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                {getInitials(video.uploaderName)}
              </div>
            )}

            <p className="text-xs text-gray-600 leading-tight">
              {video.uploaderName || "Unknown uploader"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
