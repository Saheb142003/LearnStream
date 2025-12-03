// frontend/src/pages/VideoPlayer/Player.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { useParams, useNavigate, useLocation } from "react-router-dom";
import VideoFrame from "./components/VideoFrame";
import VideoControls from "./components/VideoControls";
import TranscriptBox from "./components/TranscriptBox";
import SummaryBox from "./components/SummaryBox";
import QuizBox from "./components/QuizBox";
import Predisplay from "./components/Predisplay";
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
    [activeVideoId]
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
            lang
          )}`,
          { credentials: "include", signal: controller.signal }
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
    ]
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

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Left: video area */}
      <div className="w-full lg:flex-1 flex flex-col shrink-0 lg:shrink bg-black lg:bg-transparent justify-center lg:justify-start p-0 lg:p-6 overflow-visible">
        <div className="w-full aspect-video bg-black lg:rounded-2xl shadow-lg overflow-hidden flex items-center justify-center relative z-50">
          {loading ? (
            <SkeletonLoader className="w-full h-full bg-gray-800" />
          ) : embedUrl ? (
            <VideoFrame embedUrl={embedUrl} />
          ) : (
            <p className="text-gray-400">🎬 No video selected</p>
          )}
        </div>
        {entry && (
          <div className="p-4 lg:p-0 lg:mt-4 bg-white lg:bg-transparent border-b lg:border-none border-gray-100">
            <h2 className="text-lg lg:text-2xl font-bold text-gray-800 leading-tight line-clamp-2">
              {entry.title}
            </h2>
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
