import { useState } from "react";
import { ListVideo } from "lucide-react";

export default function PlaylistCard({ playlist, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  // Playlist thumbnail (usually first video's thumb)
  const thumbnail =
    playlist.thumbnailUrl ||
    "https://via.placeholder.com/320x180?text=Playlist";

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
        <img
          src={thumbnail}
          alt={playlist.title || "Playlist thumbnail"}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />

        {/* Playlist Overlay (Right Side) */}
        <div className="absolute top-0 bottom-0 right-0 w-1/3 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <span className="text-lg font-bold">{playlist.videoCount}</span>
          <ListVideo size={20} className="mt-1" />
        </div>

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            isHovered ? "bg-black/10" : "bg-black/0"
          }`}
        />

        {/* Play All overlay on hover */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-white/90 text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
            <ListVideo size={16} />
            View Playlist
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3
          className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors"
          title={playlist.title}
        >
          {playlist.title}
        </h3>

        {/* Metadata: uploader */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar or initials */}
            {playlist.uploaderAvatar ? (
              <img
                src={playlist.uploaderAvatar}
                alt={playlist.uploaderName || "Uploader"}
                className="w-7 h-7 rounded-full object-cover"
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                {getInitials(playlist.uploaderName)}
              </div>
            )}

            <p className="text-xs text-gray-600 leading-tight">
              {playlist.uploaderName || "Unknown uploader"}
            </p>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500 font-medium">
          Playlist • {playlist.videoCount} videos
        </div>
      </div>
    </div>
  );
}
