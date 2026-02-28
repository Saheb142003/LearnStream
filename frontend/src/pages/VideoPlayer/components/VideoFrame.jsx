// frontend/src/pages/VideoPlayer/components/VideoFrame.jsx
import React, { useEffect, useRef } from "react";

const VideoFrame = ({
  videoId,
  onWatchTimeUpdate,
  startAt = 0,
  onTimeUpdate,
}) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: Math.floor(startAt),
          autoplay: 1,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                  if (onWatchTimeUpdate) {
                    onWatchTimeUpdate(1);
                  }
                  if (onTimeUpdate && playerRef.current?.getCurrentTime) {
                    onTimeUpdate(playerRef.current.getCurrentTime());
                  }
                }, 1000);
              }
            } else {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              if (onTimeUpdate && playerRef.current?.getCurrentTime) {
                onTimeUpdate(playerRef.current.getCurrentTime());
              }
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, onWatchTimeUpdate]);

  if (!videoId) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-400 border rounded-lg">
        🎥 Select a video to load
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black rounded-xl overflow-hidden shadow-lg">
      <iframe
        ref={containerRef}
        id={`yt-player-${videoId}`}
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&showinfo=0&iv_load_policy=3&start=${Math.floor(
          startAt,
        )}&autoplay=1`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoFrame;
