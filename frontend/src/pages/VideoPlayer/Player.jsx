// frontend/src/pages/VideoPlayer/Player.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ChevronLeft, ChevronRight, X, List } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { useParams, useNavigate, useLocation } from "react-router-dom";
import VideoFrame from "./components/VideoFrame";
import VideoControls from "./components/VideoControls";
import TranscriptBox from "./components/TranscriptBox";
import SummaryBox from "./components/SummaryBox";
import QuizBox from "./components/QuizBox";
import Predisplay from "./components/Predisplay";
import PlaylistPanel from "./components/PlaylistPanel";
import SkeletonLoader from "../../components/SkeletonLoader";
import { useAuth } from "../../hooks/useAuth";
import SEO from "../../components/SEO";

// ─── sessionStorage helpers ────────────────────────────────────────────────────
const STORE_KEYS = (videoId) => ({
  transcript: `ls_transcript_${videoId}`,
  summary: `ls_summary_${videoId}`,
  quiz: `ls_quiz_${videoId}`,
  entry: `ls_entry_${videoId}`,
});

function storageGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function storageClear(...keys) {
  keys.forEach((k) => {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /**/
    }
  });
}

const BASE_URL = "";

function isMongoObjectId(str) {
  return /^[0-9a-fA-F]{24}$/.test(str);
}
function isYouTubeId(str) {
  return /^[A-Za-z0-9_-]{11}$/.test(str);
}

const formatDescription = (text) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 hover:underline break-all font-medium"
        >
          {part}
        </a>
      );
    }

    const subParts = part.split(hashtagRegex);
    return subParts.map((subPart, subIndex) => {
      if (subPart.match(hashtagRegex)) {
        return (
          <span
            key={`${index}-${subIndex}`}
            className="text-indigo-500 font-medium hover:text-indigo-600 cursor-pointer"
          >
            {subPart}
          </span>
        );
      }
      return subPart;
    });
  });
};

const Player = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, startGoogleSignIn } = useAuth();

  const search = new URLSearchParams(location.search);
  const requestedVideoId = search.get("v") || "";
  const requestedTime = parseInt(search.get("t") || "0", 10);

  const handleTimeUpdate = useCallback((currentTime) => {
    try {
      const raw = sessionStorage.getItem("ls_now_playing");
      if (raw) {
        const np = JSON.parse(raw);
        const ts = Math.floor(currentTime);
        let newUrl = np.url;
        if (newUrl.match(/[?&]t=\d+/)) {
          newUrl = newUrl.replace(/([?&])t=\d+/, `$1t=${ts}`);
        } else {
          newUrl += (newUrl.includes("?") ? "&" : "?") + `t=${ts}`;
        }
        if (np.url !== newUrl) {
          np.url = newUrl;
          sessionStorage.setItem("ls_now_playing", JSON.stringify(np));
        }
      }
    } catch {}
  }, []);

  const [entry, setEntry] = useState(() => {
    if (!id) return null;
    if (isYouTubeId(id)) {
      const cached = storageGet(STORE_KEYS(id).entry);
      if (cached) return cached;
    }
    const reqVid = requestedVideoId || null;
    if (reqVid) {
      const cached = storageGet(STORE_KEYS(reqVid).entry);
      if (cached) return cached;
    }
    return null;
  });

  const [activeVideoId, setActiveVideoId] = useState(() => {
    if (!id) return "";
    if (isYouTubeId(id)) {
      if (storageGet(STORE_KEYS(id).entry)) return id;
    }
    const reqVid = requestedVideoId || null;
    if (reqVid) {
      if (storageGet(STORE_KEYS(reqVid).entry)) return reqVid;
    }
    return "";
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [viewMode, setViewMode] = useState("transcript"); // transcript | summary | quiz

  // playlist state
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistTitle, setPlaylistTitle] = useState("Playlist");
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  // transcript state
  const [transcript, setTranscript] = useState("");
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // summary state
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // quiz state
  const [quiz, setQuiz] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState("Medium");

  // New Description & Suggestions States
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [suggestedVideos, setSuggestedVideos] = useState([]);

  // keep an AbortController so we can cancel previous requests
  const controllerRef = useRef(null);

  // ── Rehydrate ALL persisted data when activeVideoId changes ───────────────
  useEffect(() => {
    if (!activeVideoId) return;
    const keys = STORE_KEYS(activeVideoId);

    // Restore entry (title / thumbnail) immediately — avoids API round-trip on return
    const savedEntry = storageGet(keys.entry);
    if (savedEntry) setEntry(savedEntry);

    setTranscript(storageGet(keys.transcript) || "");
    setSummary(storageGet(keys.summary) || "");
    setQuiz(Array.isArray(storageGet(keys.quiz)) ? storageGet(keys.quiz) : []);
  }, [activeVideoId]);

  const embedUrl = useMemo(
    () =>
      activeVideoId
        ? `https://www.youtube-nocookie.com/embed/${activeVideoId}`
        : "",
    [activeVideoId],
  );

  // Load single video (playlist OR direct YouTube ID)
  useEffect(() => {
    if (!id) return;

    async function loadFromPlaylist(entryId) {
      // ── Check entry cache first — skips the API call on return ─────────────
      const chosenId = requestedVideoId || null;
      if (chosenId) {
        const cached = storageGet(STORE_KEYS(chosenId).entry);
        if (cached && cached.playlistId === entryId) {
          setEntry(cached);
          setActiveVideoId(chosenId);
          // Playlist videos may not be cached — fetch quietly in background
          fetch(`${BASE_URL}/api/playlists/${entryId}`, {
            credentials: "include",
          })
            .then((r) => r.json())
            .then((data) => {
              if (Array.isArray(data.videos)) setPlaylistVideos(data.videos);
              if (data.title) setPlaylistTitle(data.title);
            })
            .catch(() => {});
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${BASE_URL}/api/playlists/${entryId}`, {
          credentials: "include",
        });

        if (res.status === 401) {
          startGoogleSignIn();
          return;
        }

        let data = {};
        try {
          data = await res.json();
        } catch {
          throw new Error("Invalid server response");
        }

        if (!res.ok) throw new Error(data.message || "Failed to load playlist");

        const videos = Array.isArray(data.videos) ? data.videos : [];
        const chosenVideo =
          requestedVideoId && videos.find((v) => v.videoId === requestedVideoId)
            ? videos.find((v) => v.videoId === requestedVideoId)
            : videos[0];

        if (!chosenVideo) throw new Error("No videos found in playlist");

        setPlaylistVideos(videos);
        setPlaylistTitle(data.title || "Playlist");

        const newEntry = {
          title: chosenVideo.title || "Untitled Video",
          videoId: chosenVideo.videoId,
          thumbnailUrl: chosenVideo.thumbnailUrl,
          playlistId: entryId,
        };
        setEntry(newEntry);
        setActiveVideoId(chosenVideo.videoId);
        // State will be rehydrated from sessionStorage by the activeVideoId effect.
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (isMongoObjectId(id)) {
      loadFromPlaylist(id);
      return;
    }

    if (isYouTubeId(id)) {
      // ── Check entry cache — instant restore on return ──────────────────────
      const cached = storageGet(STORE_KEYS(id).entry);
      if (cached) {
        setEntry(cached);
        setActiveVideoId(id);
        setPlaylistVideos([]);
        setIsPlaylistOpen(false);
        setLoading(false);
        return;
      }

      // Check if video details were passed via navigation state
      if (location.state?.video) {
        const vid = location.state.video;
        setEntry({
          title: vid.title || "YouTube Video",
          videoId: vid.videoId,
          thumbnailUrl:
            vid.thumbnailUrl ||
            `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`,
        });
        setActiveVideoId(vid.videoId);
        setPlaylistVideos([]);
        setIsPlaylistOpen(false);
        // State will be rehydrated from sessionStorage by the activeVideoId effect.
        setLoading(false);
        return;
      }

      // Fetch video details from backend
      (async () => {
        setLoading(true);
        try {
          setEntry({ title: "Loading title...", videoId: id });
          setActiveVideoId(id);
          setPlaylistVideos([]);
          setIsPlaylistOpen(false);

          const res = await fetch(`${BASE_URL}/api/videos/${id}/details`);
          if (!res.ok) throw new Error("Failed to fetch details");

          const data = await res.json();
          setEntry({
            title: data.title || "YouTube Video",
            videoId: id,
            thumbnailUrl:
              data.thumbnailUrl ||
              `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          });
        } catch (e) {
          console.error("Failed to fetch video title:", e);
          setEntry({ title: "YouTube Video", videoId: id });
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    setErr("❌ Invalid player id in URL.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, requestedVideoId, navigate, startGoogleSignIn]);

  // Tracking Logic - Tracking initial view + save Now Playing & entry cache
  useEffect(() => {
    if (!activeVideoId || loading || !entry) return;

    // Cache entry so returning to this video is instant (no API round-trip)
    storageSet(STORE_KEYS(activeVideoId).entry, entry);

    // Persist current player URL so the Now Playing widget can link back
    try {
      sessionStorage.setItem(
        "ls_now_playing",
        JSON.stringify({
          url: window.location.pathname + window.location.search,
          title: entry.title,
          videoId: activeVideoId,
        }),
      );
    } catch {
      /* quota */
    }

    // Track initial video view & update learning progress
    fetch(`${BASE_URL}/api/user/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: activeVideoId,
        title: entry.title,
        thumbnailUrl: entry.thumbnailUrl,
        playlistId: entry.playlistId,
      }),
      credentials: "include",
    }).catch(console.error);

    // Watch time accumulator is managed via a ref and batched for the backend
  }, [activeVideoId, loading, entry]);

  // Fetch details (description) on activeVideoId change if missing
  useEffect(() => {
    if (!activeVideoId) return;

    const savedEntry = storageGet(STORE_KEYS(activeVideoId).entry);
    if (savedEntry && savedEntry.description) {
      setDescription(savedEntry.description);
      return;
    }

    fetch(`${BASE_URL}/api/videos/${activeVideoId}/details`)
      .then((res) => res.json())
      .then((data) => {
        setDescription(data.description || "");
        if (savedEntry) {
          savedEntry.description = data.description;
          storageSet(STORE_KEYS(activeVideoId).entry, savedEntry);
        }
      })
      .catch((err) =>
        console.error("Failed to load description details:", err),
      );
  }, [activeVideoId]);

  // Fetch dynamic suggestions from global feed when not in a playlist
  useEffect(() => {
    if (playlistVideos.length === 0) {
      fetch(`${BASE_URL}/api/feed?type=video`)
        .then((res) => res.json())
        .then((data) => {
          const list = data && Array.isArray(data.videos) ? data.videos : [];
          let items = [];
          list.forEach((v) => {
            if (
              v.videoId !== activeVideoId &&
              !items.some((x) => x.videoId === v.videoId)
            ) {
              items.push({
                videoId: v.videoId,
                title: v.title,
                thumbnailUrl:
                  v.thumbnailUrl ||
                  `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
                playlistId: v.playlistId,
              });
            }
          });
          setSuggestedVideos(items.slice(0, 6));
        })
        .catch((err) => console.error("Failed to fetch suggested feed:", err));
    }
  }, [playlistVideos, activeVideoId]);

  // Handle accumulated watch time
  const watchTimeRef = useRef(0);
  const handleWatchTimeUpdate = useCallback((seconds) => {
    watchTimeRef.current += seconds;

    // Batch updates to backend every 30 actual watched seconds
    if (watchTimeRef.current >= 30) {
      const timeToLog = watchTimeRef.current;
      watchTimeRef.current = 0; // reset
      fetch(`${BASE_URL}/api/user/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchTime: timeToLog }),
        credentials: "include",
      }).catch(console.error);
    }
  }, []);

  const handleQuizComplete = async (score, totalQuestions, difficulty) => {
    try {
      await fetch(`${BASE_URL}/api/user/quiz-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: activeVideoId,
          videoTitle: entry?.title || "Unknown Video",
          score,
          totalQuestions,
          difficulty,
          topics: [entry?.title || "General"], // Use video title as the topic cleared
        }),
        credentials: "include",
      });
    } catch (e) {
      console.error("Failed to save quiz result:", e);
    }
  };

  // fetch transcript (abortable, handles 401, 404, friendly messages)
  // Checks sessionStorage first — only hits the network if nothing is cached.
  const fetchTranscriptForActive = useCallback(
    async (opts = {}) => {
      if (!activeVideoId) {
        setErr("No active video to transcribe.");
        return;
      }

      // ── Return instantly from storage if already fetched ───────────────────
      const keys = STORE_KEYS(activeVideoId);
      const saved = storageGet(keys.transcript);
      if (saved) {
        setTranscript(saved);
        return;
      }

      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      setTranscriptLoading(true);
      setErr("");

      try {
        const lang = opts.lang || "en";
        const res = await fetch(
          `${BASE_URL}/api/videos/${activeVideoId}/transcript?lang=${encodeURIComponent(
            lang,
          )}`,
          { credentials: "include", signal: controller.signal },
        );

        if (res.status === 401) {
          startGoogleSignIn();
          return;
        }

        const data = await res
          .json()
          .catch(() => ({ message: "Invalid transcript response" }));

        if (!res.ok) {
          const msg = data?.message || "Failed to fetch transcript";
          setTranscript("");
          setErr(msg);
          return;
        }

        const text = data.transcript || "";
        setTranscript(text);
        if (text) storageSet(keys.transcript, text); // persist
        setErr("");
      } catch (e) {
        if (e.name === "AbortError") return;
        setTranscript("");
        setErr(e.message || "Failed to fetch transcript");
      } finally {
        controllerRef.current = null;
        setTranscriptLoading(false);
      }
    },
    [activeVideoId, isAuthenticated, startGoogleSignIn],
  );

  const handleSummarize = async () => {
    setViewMode("summary");
    if (!transcript) {
      if (transcriptLoading) {
        return; // Let background autoFetch complete it
      }
      setErr("Please generate transcript first.");
      return;
    }

    // ── Return instantly if summary already saved ──────────────────────────
    const keys = STORE_KEYS(activeVideoId);
    const savedSummary = storageGet(keys.summary);
    if (savedSummary) {
      setSummary(savedSummary);
      return;
    }

    setSummaryLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: activeVideoId, transcript }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      storageSet(keys.summary, data.summary); // persist
    } catch (e) {
      setErr(e.message || "Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleQuizify = async (difficulty = "medium", force = false) => {
    if (!summary) {
      setErr("Please generate summary first to create a quiz.");
      return;
    }
    setViewMode("quiz");
    setQuizDifficulty(difficulty.charAt(0).toUpperCase() + difficulty.slice(1));

    // ── Return instantly if quiz for this video is already saved ──────────
    const keys = STORE_KEYS(activeVideoId);
    const savedQuiz = storageGet(keys.quiz);
    if (!force && Array.isArray(savedQuiz) && savedQuiz.length > 0) {
      setQuiz(savedQuiz);
      return;
    }
    // Clear stale cache before re-generating (force retry)
    if (force) storageClear(keys.quiz);

    setQuizLoading(true);
    setQuiz([]);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: activeVideoId, summary, difficulty }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuiz(data.quiz);
      storageSet(keys.quiz, data.quiz); // persist
    } catch (e) {
      setErr(e.message || "Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleNext = () => {
    if (!playlistVideos.length) return;
    const currentIndex = playlistVideos.findIndex(
      (v) => v.videoId === activeVideoId,
    );
    if (currentIndex < playlistVideos.length - 1) {
      const nextVideo = playlistVideos[currentIndex + 1];
      setActiveVideoId(nextVideo.videoId);
      setEntry((prev) => ({
        ...prev,
        title: nextVideo.title,
        videoId: nextVideo.videoId,
        thumbnailUrl: nextVideo.thumbnailUrl,
      }));
      // URL update triggers activeVideoId effect which rehydrates from storage
      navigate(`/player/${entry.playlistId}?v=${nextVideo.videoId}`, {
        replace: true,
      });
    }
  };

  const handlePrev = () => {
    if (!playlistVideos.length) return;
    const currentIndex = playlistVideos.findIndex(
      (v) => v.videoId === activeVideoId,
    );
    if (currentIndex > 0) {
      const prevVideo = playlistVideos[currentIndex - 1];
      setActiveVideoId(prevVideo.videoId);
      setEntry((prev) => ({
        ...prev,
        title: prevVideo.title,
        videoId: prevVideo.videoId,
        thumbnailUrl: prevVideo.thumbnailUrl,
      }));
      // URL update triggers activeVideoId effect which rehydrates from storage
      navigate(`/player/${entry.playlistId}?v=${prevVideo.videoId}`, {
        replace: true,
      });
    }
  };

  const handlePlaylistVideoClick = (videoId) => {
    const video = playlistVideos.find((v) => v.videoId === videoId);
    if (!video) return;

    setActiveVideoId(videoId);
    setEntry((prev) => ({
      ...prev,
      title: video.title,
      videoId: video.videoId,
      thumbnailUrl: video.thumbnailUrl,
    }));
    // activeVideoId change triggers rehydration from sessionStorage
    navigate(`/player/${entry.playlistId}?v=${videoId}`, { replace: true });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] bg-gray-50 overflow-y-auto lg:overflow-hidden relative">
      <SEO
        title={
          entry?.title
            ? `${viewMode === "quiz" ? `${quizDifficulty} Quiz: ` : ""}${entry.title}`
            : "Video Player"
        }
        description={summary ? summary.substring(0, 150) + "..." : undefined}
        url={`/player/${id}${activeVideoId ? `?v=${activeVideoId}` : ""}`}
        quizQuestions={viewMode === "quiz" ? quiz : undefined}
      />

      {/* Playlist Sidebar Overlay */}
      <AnimatePresence>
        {playlistVideos.length > 0 && isPlaylistOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 bottom-0 w-72 sm:w-80 bg-white/50 backdrop-blur-md border-r border-gray-200/50 z-[60] flex flex-col shadow-2xl rounded-r-3xl overflow-hidden"
          >
            <div className="p-2 border-b border-gray-200/50 flex justify-between items-center bg-gray-50/30">
              <h3
                className="text-gray-800 font-bold text-sm sm:text-base ml-1 truncate pr-2"
                title={playlistTitle}
              >
                {playlistTitle}
              </h3>
              <button
                onClick={() => setIsPlaylistOpen(false)}
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <PlaylistPanel
                videos={playlistVideos}
                activeVideoId={activeVideoId}
                onPlay={handlePlaylistVideoClick}
                loading={loading}
                variant="glass"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button (Visible when playlist exists and sidebar is closed) */}
      {playlistVideos.length > 0 && !isPlaylistOpen && (
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsPlaylistOpen(true)}
          className="absolute left-0 top-24 z-50 bg-white/80 backdrop-blur-md text-indigo-600 p-3 rounded-r-xl border-y border-r border-indigo-100 hover:bg-indigo-50 shadow-lg group transition-all"
          title="Show Playlist"
        >
          <List size={24} />
        </motion.button>
      )}

      {/* Left: video area */}
      <div className="w-full lg:flex-1 flex flex-col bg-gray-50 lg:bg-transparent lg:overflow-y-auto overflow-x-hidden h-auto lg:h-full no-scrollbar">
        <div className="w-full aspect-video bg-black lg:rounded-2xl shadow-lg overflow-hidden flex items-center justify-center relative z-10 shrink-0">
          {loading ? (
            <SkeletonLoader className="w-full h-full bg-gray-800" />
          ) : activeVideoId ? (
            <VideoFrame
              key={activeVideoId}
              videoId={activeVideoId}
              onWatchTimeUpdate={handleWatchTimeUpdate}
              startAt={requestedTime}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <p className="text-gray-400">🎬 No video selected</p>
          )}
        </div>

        {/* details panel below video */}
        <div className="w-full mt-2 lg:mt-0 px-3 lg:px-0 pb-16 lg:pb-6 flex flex-col gap-2 sm:gap-3 lg:gap-4 flex-1 h-auto">
          {entry && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100/90 shadow-xs flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <div
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center gap-2.5 cursor-pointer group flex-1"
                >
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 leading-snug line-clamp-2 font-sans group-hover:text-indigo-600 transition-colors">
                    {entry.title}
                  </h1>
                  <span className="text-gray-400 group-hover:text-indigo-600 transition-colors text-base lg:text-lg shrink-0 p-1 rounded-lg bg-gray-50 group-hover:bg-indigo-50">
                    {showDescription ? "▴" : "▾"}
                  </span>
                </div>

                {/* Navigation Controls */}
                {playlistVideos.length > 0 && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handlePrev}
                      disabled={
                        playlistVideos.findIndex(
                          (v) => v.videoId === activeVideoId,
                        ) <= 0
                      }
                      className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 shadow-xs hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Previous Video"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={
                        playlistVideos.findIndex(
                          (v) => v.videoId === activeVideoId,
                        ) >=
                        playlistVideos.length - 1
                      }
                      className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 disabled:shadow-none disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                      title="Next Video"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showDescription && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="border-t border-gray-100 pt-3 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50/90 rounded-xl text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-slate-200/70 font-sans shadow-2xs">
                      {description
                        ? formatDescription(description)
                        : "No description available for this video."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Tab Controls and Active Content Box */}
          <div className="block lg:hidden mt-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            {embedUrl && (
              <VideoControls
                viewMode={viewMode}
                setViewMode={(tab) => {
                  if (viewMode === tab) {
                    setViewMode(null);
                  } else {
                    setViewMode(tab);
                  }
                }}
                onTranscribe={() => fetchTranscriptForActive()}
                onSummarize={handleSummarize}
                onQuizify={handleQuizify}
                transcriptLoading={transcriptLoading}
                summaryLoading={summaryLoading}
                quizLoading={quizLoading}
                activeVideoId={activeVideoId}
                hasTranscript={!!transcript}
              />
            )}
            <div className="mt-2 sm:mt-4">
              <AnimatePresence mode="wait">
                {viewMode === "transcript" &&
                  (!transcript && !transcriptLoading ? (
                    <Predisplay />
                  ) : (
                    <motion.div
                      key="transcript-mob"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative"
                    >
                      {!isAuthenticated && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-50 rounded-xl">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              ></path>
                            </svg>
                          </div>
                          <h3 className="font-semibold text-gray-800 text-xs">
                            Unlock Full Transcript
                          </h3>
                          <button
                            onClick={startGoogleSignIn}
                            className="mt-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all"
                          >
                            Sign In
                          </button>
                        </div>
                      )}
                      <div
                        className={
                          !isAuthenticated
                            ? "max-h-[200px] overflow-hidden select-none pointer-events-none"
                            : "max-h-[380px] overflow-y-auto no-scrollbar"
                        }
                      >
                        <TranscriptBox
                          loading={transcriptLoading}
                          transcript={transcript}
                        />
                      </div>
                    </motion.div>
                  ))}

                {viewMode === "summary" && (
                  <motion.div
                    key="summary-mob"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative"
                  >
                    {!isAuthenticated && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-50 rounded-xl">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            ></path>
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-xs">
                          Unlock AI Summary
                        </h3>
                        <button
                          onClick={startGoogleSignIn}
                          className="mt-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all"
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                    <div
                      className={
                        !isAuthenticated
                          ? "max-h-[200px] overflow-hidden select-none pointer-events-none"
                          : "max-h-[380px] overflow-y-auto custom-scrollbar"
                      }
                    >
                      <SummaryBox summary={summary} loading={summaryLoading} />
                    </div>
                  </motion.div>
                )}

                {viewMode === "quiz" && (
                  <motion.div
                    key="quiz-mob"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative"
                  >
                    {!isAuthenticated && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-50 rounded-xl">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            ></path>
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-xs">
                          Unlock Practice Quiz
                        </h3>
                        <button
                          onClick={startGoogleSignIn}
                          className="mt-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all"
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                    <div
                      className={
                        !isAuthenticated
                          ? "max-h-[200px] overflow-hidden select-none pointer-events-none"
                          : "max-h-[380px] overflow-y-auto custom-scrollbar"
                      }
                    >
                      <QuizBox
                        quiz={quiz}
                        loading={quizLoading}
                        onRetry={(diff) => handleQuizify(diff, true)}
                        onQuizComplete={handleQuizComplete}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Suggested Study Material (Renders in Left Scroll Column for both Desktop and Mobile view) */}
          <div className="mt-4 pt-2 border-t border-gray-100">
            <h3 className="hidden lg:flex font-bold text-gray-800 text-sm lg:text-base mb-3 items-center gap-2 px-1">
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 002 2z"
                ></path>
              </svg>
              Suggested Study Material
            </h3>

            {/* Desktop layout: Grid */}
            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {suggestedVideos.length > 0 ? (
                suggestedVideos.map((v) => (
                  <div
                    key={v.videoId}
                    onClick={() => {
                      navigate(
                        `/player/${v.playlistId || v.videoId}?v=${v.videoId}`,
                      );
                    }}
                    className="group bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-100 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h4 className="font-semibold text-xs text-gray-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                        {v.title}
                      </h4>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-gray-400">
                  No suggested videos found.
                </div>
              )}
            </div>

            {/* Mobile layout: Vertical List (YouTube-like) */}
            <div className="flex lg:hidden flex-col gap-3 pb-4">
              {suggestedVideos.length > 0 ? (
                suggestedVideos.map((v) => (
                  <div
                    key={v.videoId}
                    onClick={() => {
                      navigate(
                        `/player/${v.playlistId || v.videoId}?v=${v.videoId}`,
                      );
                    }}
                    className="flex flex-row gap-3 cursor-pointer items-start hover:bg-gray-100/50 p-1.5 rounded-xl transition-colors"
                  >
                    <div className="w-32 aspect-video bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-start min-w-0 py-0.5">
                      <h4 className="font-semibold text-xs text-gray-900 line-clamp-2 leading-snug mb-1">
                        {v.title}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Study Material
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No suggested videos found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: tools (Visible on Desktop only) */}
      <div className="hidden lg:flex lg:flex-col lg:w-[400px] xl:w-[450px] bg-white border-l border-gray-100 z-20 overflow-hidden h-full shrink-0">
        {/* Header / Controls */}
        <div className="p-2.5 lg:py-2 lg:px-3 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          {err && (
            <div className="mb-3 p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">
              {err}
            </div>
          )}

          {loading ? (
            <div className="flex gap-2">
              <SkeletonLoader className="h-12 flex-1 rounded-xl" />
              <SkeletonLoader className="h-12 flex-1 rounded-xl" />
              <SkeletonLoader className="h-12 flex-1 rounded-xl" />
            </div>
          ) : embedUrl ? (
            <VideoControls
              viewMode={viewMode}
              setViewMode={setViewMode}
              onTranscribe={() => fetchTranscriptForActive()}
              onSummarize={handleSummarize}
              onQuizify={handleQuizify}
              transcriptLoading={transcriptLoading}
              summaryLoading={summaryLoading}
              quizLoading={quizLoading}
              activeVideoId={activeVideoId}
              hasTranscript={!!transcript}
            />
          ) : (
            <p className="text-gray-500 text-center py-4">No video loaded.</p>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-x-hidden lg:overflow-y-auto p-2 lg:p-3 lg:custom-scrollbar bg-gray-50/50 relative">
          {embedUrl && !loading && (
            <AnimatePresence mode="wait">
              {viewMode === "transcript" &&
                (!transcript && !transcriptLoading ? (
                  <Predisplay />
                ) : (
                  <motion.div
                    key="transcript"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="lg:h-full relative"
                  >
                    {!isAuthenticated && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-50 rounded-2xl">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-sm">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            ></path>
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800">
                          Unlock Full Transcript
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-[280px]">
                          Sign in to view interactive transcripts, generate note
                          cards, and track your history.
                        </p>
                        <button
                          onClick={startGoogleSignIn}
                          className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all transform hover:-translate-y-0.5"
                        >
                          Sign In with Google
                        </button>
                      </div>
                    )}
                    <div
                      className={
                        !isAuthenticated
                          ? "max-h-[220px] overflow-hidden select-none pointer-events-none"
                          : ""
                      }
                    >
                      <TranscriptBox
                        loading={transcriptLoading}
                        transcript={transcript}
                      />
                    </div>
                  </motion.div>
                ))}

              {viewMode === "summary" && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative lg:h-full"
                >
                  {!isAuthenticated && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-50 rounded-2xl">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-sm">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          ></path>
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800">
                        Unlock AI Summary
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-[280px]">
                        Get key takeaways, structured outlines, and study notes
                        instantly.
                      </p>
                      <button
                        onClick={startGoogleSignIn}
                        className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all transform hover:-translate-y-0.5"
                      >
                        Sign In with Google
                      </button>
                    </div>
                  )}
                  <div
                    className={
                      !isAuthenticated
                        ? "max-h-[220px] overflow-hidden select-none pointer-events-none"
                        : ""
                    }
                  >
                    <SummaryBox summary={summary} loading={summaryLoading} />
                  </div>
                </motion.div>
              )}

              {viewMode === "quiz" && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative lg:h-full"
                >
                  {!isAuthenticated && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-50 rounded-2xl">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-sm">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          ></path>
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800">
                        Unlock Practice Quiz
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-[280px]">
                        Test your retention and score points using active recall
                        practice questions.
                      </p>
                      <button
                        onClick={startGoogleSignIn}
                        className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all transform hover:-translate-y-0.5"
                      >
                        Sign In with Google
                      </button>
                    </div>
                  )}
                  <div
                    className={
                      !isAuthenticated
                        ? "max-h-[220px] overflow-hidden select-none pointer-events-none"
                        : ""
                    }
                  >
                    <QuizBox
                      quiz={quiz}
                      loading={quizLoading}
                      onRetry={(diff) => handleQuizify(diff, true)}
                      onQuizComplete={handleQuizComplete}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default Player;
