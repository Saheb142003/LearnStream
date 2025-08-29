/* eslint-disable no-unused-vars */
// frontend/src/pages/Home/Home.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;
const AUTH_ROUTE = "/profile"; // where we send users to sign in

function isYouTubeUrl(value) {
  if (!value) return false;
  const trimmed = value.trim();
  return /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/playlist\?list=)/i.test(
    trimmed
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (e) {
      // Clipboard might not be available in some contexts — ignore silently
      console.warn("Clipboard unavailable", e);
    }
  };

  const handleAddAndGo = useCallback(
    async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      setErr("");
      setInfo("");

      if (!url?.trim()) {
        setErr("Please paste a YouTube video or playlist URL.");
        return;
      }

      const trimmed = url.trim();
      if (!isYouTubeUrl(trimmed)) {
        setErr("Please paste a valid YouTube video or playlist URL.");
        return;
      }

      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${BASE_URL}/api/playlists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url: trimmed }),
          signal: controller.signal,
        });

        if (res.status === 401) {
          // preserve pending action and send user to auth flow
          try {
            sessionStorage.setItem(
              "afterAuthRedirect",
              JSON.stringify({ type: "player", url: trimmed })
            );
          } catch (e) {
            console.warn(
              "Could not save pending redirect to sessionStorage",
              e
            );
          }

          navigate(AUTH_ROUTE, {
            replace: true,
            state: { redirectTo: "/player" },
          });
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        let data = {};
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          // server returned non-JSON (HTML error page etc.) — handle gracefully
          data = {};
        }

        if (!res.ok) {
          throw new Error(
            data.message || `Server responded with ${res.status}`
          );
        }

        const id = data._id ?? data.id ?? data.playlistId;
        if (!id) throw new Error("Server did not return a valid resource id.");

        navigate(`/player/${id}`);
      } catch (err) {
        if (err.name === "AbortError") {
          console.info("Request aborted");
          return;
        }
        setErr(err.message || "Failed to add playlist.");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [url, navigate]
  );

  const sampleUrls = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/playlist?list=PL9tY0BWXOZFtN3G9Qx1qV7Q1q2N7w4a1c",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-300 text-white px-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-3xl"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">
          Welcome to <span className="text-yellow-300">LearnStream 🎓</span>
        </h1>

        <p className="text-lg md:text-xl mb-8 opacity-90 leading-relaxed">
          Turn your <span className="font-semibold">YouTube videos</span> and{" "}
          <span className="font-semibold">playlists</span> into an interactive
          learning experience with{" "}
          <span className="underline decoration-yellow-300">
            transcripts, summaries, and quizzes
          </span>
          .
        </p>

        {/* Input Row */}
        <form
          onSubmit={handleAddAndGo}
          className="flex w-full max-w-2xl mx-auto items-stretch gap-3 mb-4"
          noValidate
        >
          <label htmlFor="yt-url" className="sr-only">
            YouTube video or playlist URL
          </label>

          <input
            id="yt-url"
            name="yt-url"
            type="url"
            inputMode="url"
            required
            placeholder="Paste a YouTube video or playlist URL…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            className="flex-1 rounded-xl px-4 py-3 text-gray-900 outline-none shadow-lg"
            aria-label="YouTube video or playlist URL"
          />

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="px-6 py-3 rounded-xl bg-white text-gray-900 font-bold shadow-md hover:scale-105 transform transition disabled:opacity-60"
          >
            {loading ? "Adding…" : "Watch"}
          </button>
        </form>

        <div className="flex items-center gap-3 justify-center mb-3">
          <button
            type="button"
            onClick={handlePaste}
            className="text-sm underline decoration-white/60"
          >
            Paste from clipboard
          </button>

          <span className="text-sm opacity-80">·</span>

          <button
            type="button"
            onClick={() => {
              setUrl("");
              setErr("");
            }}
            className="text-sm underline decoration-white/60"
          >
            Clear
          </button>

          <span className="text-sm opacity-80">·</span>

          <div className="flex gap-2">
            {sampleUrls.map((s, i) => (
              <button
                key={i}
                onClick={() => setUrl(s)}
                className="text-sm bg-white/10 px-2 py-1 rounded"
              >
                {i === 0 ? "Sample video" : "Sample playlist"}
              </button>
            ))}
          </div>
        </div>

        {err && (
          <p className="text-sm text-red-200 mb-4" role="alert">
            {err}
          </p>
        )}

        {info && (
          <p className="text-sm text-yellow-100 mb-4" role="status">
            {info}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/feed"
            className="px-6 py-3 rounded-lg bg-white text-gray-900 font-bold text-lg shadow-md hover:scale-105 transform transition"
          >
            🚀 Start Learning
          </Link>

          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-lg bg-white text-indigo-700 font-bold text-lg shadow-md hover:scale-105 transform transition"
          >
            📊 Go to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl"
      >
        {[
          {
            title: "🎥 Watch",
            desc: "Play YouTube videos distraction-free in our custom player.",
          },
          {
            title: "📖 Transcript",
            desc: "Get full transcripts automatically for better learning.",
          },
          {
            title: "🧠 Quiz",
            desc: "Test your understanding with AI-powered quizzes.",
          },
        ].map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-white text-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <footer className="mt-20 text-sm opacity-70">
        © {new Date().getFullYear()} LearnStream — Learn Smarter, Not Harder 🚀
      </footer>
    </div>
  );
}
