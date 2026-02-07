// frontend/src/pages/VideoPlayer/Player.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Play, ChevronLeft, ChevronRight, X, List } from "lucide-react";
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

const BASE_URL = "";
const AUTH_ROUTE = "/profile";

function isMongoObjectId(str) {
  return /^[0-9a-fA-F]{24}$/.test(str);
}
function isYouTubeId(str) {
  return /^[A-Za-z0-9_-]{11}$/.test(str);
}

const Player = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, startGoogleSignIn } = useAuth();

  const search = new URLSearchParams(location.search);
  const requestedVideoId = search.get("v") || "";

  const [entry, setEntry] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState("");
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

  // keep an AbortController so we can cancel previous requests
  const controllerRef = useRef(null);

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
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${BASE_URL}/api/playlists/${entryId}`, {
          credentials: "include",
        });

        if (res.status === 401) {
          // If unauthorized for playlist, redirect to auth
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

        setPlaylistVideos(videos); // Store playlist videos
        setPlaylistTitle(data.title || "Playlist"); // Store playlist title

        setEntry({
          title: chosenVideo.title || "Untitled Video",
          videoId: chosenVideo.videoId,
          thumbnailUrl: chosenVideo.thumbnailUrl,
          playlistId: entryId,
        });
        setActiveVideoId(chosenVideo.videoId);
        setTranscript(""); // reset transcript
        setSummary("");
        setQuiz([]);

        // Auto-switch to playlist view if it's a playlist
        // setViewMode("playlist");
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
        setPlaylistVideos([]); // No playlist
        setIsPlaylistOpen(false);
        setTranscript("");
        setSummary("");
        setQuiz([]);
        setLoading(false);
        return;
      }

      // Fetch video details from backend
      (async () => {
        setLoading(true);
        try {
          // Set initial state
          setEntry({ title: "Loading title...", videoId: id });
          setActiveVideoId(id);
          setPlaylistVideos([]);
          setIsPlaylistOpen(false);
          setTranscript("");
          setSummary("");
          setQuiz([]);

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
  }, [id, requestedVideoId, navigate, startGoogleSignIn]);

  // Tracking Logic
  useEffect(() => {
    if (!activeVideoId || loading || !entry) return;

    // Track initial video view & update learning progress
    fetch(`${BASE_URL}/api/user/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: activeVideoId,
        appOpenTime: 0,
        title: entry.title,
        thumbnailUrl: entry.thumbnailUrl,
        playlistId: entry.playlistId,
      }),
      credentials: "include",
    }).catch(console.error);

    // Interval to track watch time (every 30 seconds)
    const interval = setInterval(() => {
      fetch(`${BASE_URL}/api/user/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchTime: 30 }),
        credentials: "include",
      }).catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeVideoId, loading, entry]);

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
  const fetchTranscriptForActive = useCallback(
    async (opts = {}) => {
      if (!activeVideoId) {
        setErr("No active video to transcribe.");
        return;
      }

      // Enforce Auth for Transcription
      if (!isAuthenticated) {
        startGoogleSignIn();
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

        setTranscript(data.transcript || "");
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
    [
      activeVideoId,
      id,
      requestedVideoId,
      navigate,
      isAuthenticated,
      startGoogleSignIn,
    ],
  );

  const handleSummarize = async () => {
    if (!isAuthenticated) {
      startGoogleSignIn();
      return;
    }

    if (!transcript) {
      setErr("Please generate transcript first.");
      return;
    }
    setViewMode("summary");
    // if (summary) return; // Allow regeneration

    setSummaryLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
    } catch (e) {
      setErr(e.message || "Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleQuizify = async (difficulty = "medium") => {
    if (!summary) {
      setErr("Please generate summary first to create a quiz.");
      return;
    }
    setViewMode("quiz");

    // Always regenerate quiz if requested, or maybe check if already exists for this difficulty?
    // For now let's allow regenerating
    setQuizLoading(true);
    setQuiz([]);
    try {
      const res = await fetch(`${BASE_URL}/api/ai/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, difficulty }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuiz(data.quiz);
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
      // Reset states
      setTranscript("");
      setSummary("");
      setQuiz([]);
      // Update URL seamlessly
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
      // Reset states
      setTranscript("");
      setSummary("");
      setQuiz([]);
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
    setTranscript("");
    setSummary("");
    setQuiz([]);
    navigate(`/player/${entry.playlistId}?v=${videoId}`, { replace: true });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-gray-50 overflow-hidden relative">
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
      <div className="w-full lg:flex-1 flex flex-col shrink-0 lg:shrink bg-black lg:bg-transparent justify-center lg:justify-start p-0 lg:p-6 overflow-visible">
        <div className="w-full aspect-video bg-black lg:rounded-2xl shadow-lg overflow-hidden flex items-center justify-center relative z-10">
          {loading ? (
            <SkeletonLoader className="w-full h-full bg-gray-800" />
          ) : embedUrl ? (
            <VideoFrame embedUrl={embedUrl} />
          ) : (
            <p className="text-gray-400">🎬 No video selected</p>
          )}
        </div>
        {entry && (
          <div className="p-4 lg:p-0 lg:mt-4 bg-white lg:bg-transparent border-b lg:border-none border-gray-100 flex justify-between items-start gap-4">
            <h2 className="text-lg lg:text-2xl font-bold text-gray-800 leading-tight line-clamp-2 flex-1">
              {entry.title}
            </h2>

            {/* Navigation Controls - Modern UI */}
            {playlistVideos.length > 0 && (
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={handlePrev}
                  disabled={
                    playlistVideos.findIndex(
                      (v) => v.videoId === activeVideoId,
                    ) <= 0
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Previous Video"
                >
                  <ChevronLeft size={20} />
                  <span className="hidden sm:inline text-sm">Prev</span>
                </button>
                <button
                  onClick={handleNext}
                  disabled={
                    playlistVideos.findIndex(
                      (v) => v.videoId === activeVideoId,
                    ) >=
                    playlistVideos.length - 1
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                  title="Next Video"
                >
                  <span className="hidden sm:inline text-sm">Next</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: tools */}
      <div className="flex-1 w-full lg:flex-none lg:w-[400px] xl:w-[450px] bg-white shadow-xl border-l border-gray-100 flex flex-col z-20 overflow-hidden">
        {/* Header / Controls */}
        <div className="p-3 lg:p-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
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
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-gray-50/50">
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
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <TranscriptBox
                      loading={transcriptLoading}
                      transcript={transcript}
                    />
                  </motion.div>
                ))}

              {viewMode === "summary" && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SummaryBox summary={summary} loading={summaryLoading} />
                </motion.div>
              )}

              {viewMode === "quiz" && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <QuizBox
                    quiz={quiz}
                    loading={quizLoading}
                    onRetry={(diff) => handleQuizify(diff)}
                    onQuizComplete={handleQuizComplete}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer / Back Button */}
        <div className="p-3 lg:p-4 border-t border-gray-100 bg-white">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 hover:bg-gray-100 hover:text-indigo-600 transition-all duration-200"
          >
            <span>⬅</span>{" "}
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;
