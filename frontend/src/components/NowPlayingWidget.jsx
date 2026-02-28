// frontend/src/components/NowPlayingWidget.jsx
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function readNowPlaying() {
  try {
    const raw = sessionStorage.getItem("ls_now_playing");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readCollapsedState() {
  try {
    return sessionStorage.getItem("ls_np_collapsed") === "true";
  } catch {
    return false;
  }
}

export default function NowPlayingWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const [np, setNp] = useState(() => readNowPlaying());
  const currentVidRef = useRef(np?.videoId || null);

  // Interaction states
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(() => readCollapsedState());
  const hideTimerRef = useRef(null);

  const setCollapsedState = (val) => {
    setCollapsed(val);
    try {
      sessionStorage.setItem("ls_np_collapsed", val);
    } catch {}
  };

  const startAutoCollapseTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setCollapsedState(true);
    }, 4500);
  };

  useEffect(() => {
    const data = readNowPlaying();
    setNp(data);
    setVisible(true);

    // Only un-collapse and restart the initial timer if a completely NEW video is playing
    if (data && data.videoId !== currentVidRef.current) {
      currentVidRef.current = data.videoId;
      setCollapsedState(false);
      startAutoCollapseTimer();
    }

    return () => {};
  }, [location.pathname, location.search]);

  // Pause hide timer on hover
  const handleMouseEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  // When mouse leaves the expanded widget, collapse it after 2 seconds
  const handleMouseLeave = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setCollapsedState(true);
    }, 2000);
  };

  const onPlayer = location.pathname.startsWith("/player");
  if (!np || onPlayer || !visible) return null;

  const thumb = `https://img.youtube.com/vi/${np.videoId}/mqdefault.jpg`;

  const handleDismiss = (e) => {
    e.stopPropagation();
    setVisible(false);
    try {
      sessionStorage.removeItem("ls_now_playing");
      sessionStorage.removeItem("ls_np_collapsed");
    } catch {}
  };

  const handleReturn = () => {
    navigate(np.url);
  };

  return (
    <>
      <style>{`
        @keyframes npSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .np-widget-animate { animation: npSlideUp 0.3s cubic-bezier(0.34,1.4,0.64,1) forwards; }
      `}</style>

      {/* 
        Outer wrapper container: handles the collapse left/right slide.
      */}
      <div
        className={`fixed bottom-6 right-0 z-[9999] w-64 rounded-l-xl transition-transform duration-500 ease-out flex ${
          collapsed ? "translate-x-full" : "translate-x-0"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/*
          Hitbox Fix:
          This invisible tab sits outside the w-64 container extending to the left.
        */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setCollapsedState(false);
            // Since the user explicitly clicked the tab, their mouse is *already* hovering the widget.
            // We should NOT start the auto-collapse timer here, because the `onMouseEnter` event already
            // fired previously, and the timer will blindly run out even if they keep their mouse there.
            // When they eventually move their mouse off, `handleMouseLeave` will trigger and collapse it properly.
          }}
          className={`absolute left-0 top-0 bottom-0 w-4 -ml-4 bg-indigo-500 hover:bg-indigo-400 cursor-pointer shadow-md rounded-l-md flex items-center justify-center transition-colors z-[10001] ${
            collapsed
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          title="Show Now Playing"
        >
          <span className="text-white text-[10px] transform -rotate-90 origin-center whitespace-nowrap font-bold tracking-widest leading-none drop-shadow">
            ▶
          </span>
        </div>

        {/* 
          Inner widget: visually cleaned up with strong shadow
        */}
        <div
          onClick={handleReturn}
          className="np-widget-animate relative w-full overflow-hidden rounded-l-xl shadow-[0_0_30px_rgba(0,0,0,0.6)] ring-1 ring-white/10 cursor-pointer group"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
          }}
          title="Return to Video"
        >
          {/* Thumbnail area - 16:9 aspect ratio */}
          <div className="relative h-[144px] w-full overflow-hidden">
            <img
              src={thumb}
              alt={np.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              style={{ opacity: 0.85 }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {/* Stronger Bottom Gradient for text clarity */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%)",
              }}
            />

            {/* Pulsing badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span className="text-white/90 text-[10px] font-semibold tracking-wider uppercase drop-shadow-md">
                Now Playing
              </span>
            </div>

            {/* Dismiss X */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white/50 hover:text-white
                         bg-black/40 hover:bg-black/80 rounded-full w-6 h-6
                         flex items-center justify-center text-xs font-bold transition-all z-10"
              title="Dismiss completely"
            >
              ✕
            </button>

            {/* Title */}
            <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium leading-snug drop-shadow-lg line-clamp-2">
              {np.title || "Untitled"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
