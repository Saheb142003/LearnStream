// frontend/src/pages/VideoPlayer/Player.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import VideoFrame from "./components/VideoFrame";
import VideoControls from "./components/VideoControls";
import TranscriptBox from "./components/TranscriptBox";
import SummaryBox from "./components/SummaryBox";
import QuizBox from "./components/QuizBox";
import Predisplay from "./components/Predisplay";

const BASE_URL = import.meta.env.VITE_API_URL;
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

  // keep an AbortController so we can cancel previous requests
  const controllerRef = useRef(null);

  const embedUrl = useMemo(
    () =>
      activeVideoId ? `https://www.youtube.com/embed/${activeVideoId}` : "",
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
          navigate(AUTH_ROUTE, {
            replace: true,
            state: {
              redirectTo: `/player/${entryId}${
                requestedVideoId ? `?v=${requestedVideoId}` : ""
              }`,
            },
          });
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
        });
        setActiveVideoId(chosenVideo.videoId);
        setTranscript(""); // reset transcript
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
      setEntry({ title: "YouTube Video", videoId: id });
      setActiveVideoId(id);
      setTranscript("");
      return;
    }

    setErr("❌ Invalid player id in URL.");
  }, [id, requestedVideoId, navigate]);

  // fetch transcript (abortable, handles 401, 404, friendly messages)
  const fetchTranscriptForActive = useCallback(
    async (opts = {}) => {
      if (!activeVideoId) {
        setErr("No active video to transcribe.");
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
          navigate(AUTH_ROUTE, {
            replace: true,
            state: {
              redirectTo: `/player/${id}${
                requestedVideoId ? `?v=${requestedVideoId}` : ""
              }`,
            },
          });
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
    [activeVideoId, id, requestedVideoId, navigate]
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-140px)] bg-gray-50">
      {/* Left: video area */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 flex items-center justify-center bg-black rounded-2xl shadow-lg overflow-hidden">
          {embedUrl ? (
            <VideoFrame embedUrl={embedUrl} />
          ) : loading ? (
            <p className="text-gray-400">⏳ Loading video…</p>
          ) : (
            <p className="text-gray-400">🎬 No video selected</p>
          )}
        </div>
        {entry && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-indigo-700">{entry.title}</h2>
          </div>
        )}
      </div>

      {/* Right: tools */}
      <div className="w-full md:w-10/35 bg-white shadow-xl p-6 border-l flex flex-col">
        {loading && <p className="text-gray-500 mb-2">⏳ Loading…</p>}
        {err && (
          <div className="mb-3 p-3 text-sm rounded bg-red-50 text-red-700 border border-red-200">
            {err}
          </div>
        )}

        {embedUrl && !loading ? (
          <>
            <VideoControls
              viewMode={viewMode}
              setViewMode={setViewMode}
              onTranscribe={() => fetchTranscriptForActive()}
              transcriptLoading={transcriptLoading}
              activeVideoId={activeVideoId}
            />

            {viewMode === "transcript" && (
              <TranscriptBox
                loading={transcriptLoading}
                transcript={transcript || <Predisplay />} // displays the predisplay component how to generated the transcript,summary,quiz
              />
            )}

            {viewMode === "summary" && <SummaryBox summary={""} />}
            {viewMode === "quiz" && <QuizBox quiz={[]} />}
          </>
        ) : (
          !loading && <p className="text-gray-500">No video loaded.</p>
        )}

        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            ⬅ Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;
