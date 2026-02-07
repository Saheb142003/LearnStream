import React, { useEffect, useRef } from "react";
import { Play } from "lucide-react";

const PlaylistPanel = ({
  videos = [],
  activeVideoId,
  onPlay,
  loading,
  variant = "default",
}) => {
  const activeRef = useRef(null);

  // Auto-scroll to active video
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeVideoId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-full h-20 animate-pulse rounded-lg ${variant === "glass" ? "bg-white/10" : "bg-gray-200"}`}
          ></div>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-10 ${variant === "glass" ? "text-gray-400" : "text-gray-400"}`}
      >
        <p>No videos in this playlist.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4">
      {videos.map((video, index) => {
        const isActive = video.videoId === activeVideoId;

        let containerClass = "";
        let textClass = "";
        let indexClass = "";

        if (variant === "glass") {
          containerClass = isActive
            ? "bg-indigo-50/90 border-indigo-200 shadow-sm"
            : "bg-transparent border-transparent hover:bg-gray-100/80 hover:border-gray-200/50";
          textClass = isActive ? "text-indigo-700" : "text-gray-800";
          indexClass = "text-gray-400";
        } else {
          containerClass = isActive
            ? "bg-indigo-50 border-indigo-200 shadow-sm"
            : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200";
          textClass = isActive ? "text-indigo-700" : "text-gray-700";
          indexClass = "text-gray-400";
        }

        return (
          <div
            key={video.videoId}
            ref={isActive ? activeRef : null}
            onClick={() => onPlay(video.videoId)}
            className={`group flex items-center gap-3 p-3 sm:p-2 rounded-xl transition-all cursor-pointer border ${containerClass}`}
          >
            {/* Thumbnail */}
            <div className="relative w-24 aspect-video bg-black rounded-lg overflow-hidden shrink-0 shadow-sm">
              <img
                src={
                  video.thumbnailUrl ||
                  `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
                }
                alt={video.title}
                className={`w-full h-full object-cover transition-opacity ${
                  isActive ? "opacity-80" : "opacity-100 group-hover:opacity-90"
                }`}
              />
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    <Play size={10} className="text-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm font-semibold line-clamp-2 leading-tight mb-1 ${textClass}`}
              >
                {video.title}
              </h4>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlaylistPanel;
