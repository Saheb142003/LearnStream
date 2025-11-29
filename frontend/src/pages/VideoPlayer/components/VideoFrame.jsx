// frontend/src/pages/VideoPlayer/components/VideoFrame.jsx
import React from "react";

const VideoFrame = ({ embedUrl }) => {
  const [iframeLoaded, setIframeLoaded] = React.useState(false);

  // Reset loaded state when url changes
  React.useEffect(() => {
    setIframeLoaded(false);
  }, [embedUrl]);

  if (!embedUrl) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-400 border rounded-lg">
        🎥 Paste a YouTube link to load video
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black rounded-xl overflow-hidden shadow-lg">
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin text-4xl text-gray-500">⏳</div>
        </div>
      )}
      <iframe
        width="100%"
        height="100%"
        src={`${embedUrl}?rel=0&modestbranding=1&playsinline=1`}
        title="YouTube video player"
        className={`w-full h-full transition-opacity duration-500 ${
          iframeLoaded ? "opacity-100" : "opacity-0"
        }`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  );
};

export default VideoFrame;
