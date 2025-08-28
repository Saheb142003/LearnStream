// frontend/src/pages/VideoPlayer/components/VideoFrame.jsx
import React from "react";

const VideoFrame = ({ embedUrl }) => {
  if (!embedUrl) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-400 border rounded-lg">
        🎥 Paste a YouTube link to load video
      </div>
    );
  }

  return (
    <iframe
      width="100%"
      height="400"
      src={embedUrl}
      title="YouTube video player"
      className="rounded-xl shadow-lg"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy" // this uses in new commit
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
};

export default VideoFrame;
