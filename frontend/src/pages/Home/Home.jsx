/* eslint-disable no-unused-vars */
// frontend/src/pages/Home/Home.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AUTH_ROUTE = "/profile"; // change to your real login route if different (e.g., "/login")

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleAddAndGo = async (e) => {
    e.preventDefault();
    if (!url) return;

    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url }), // backend now accepts raw URL
      });

      if (res.status === 401) {
        // not authenticated → send to login/profile
        navigate(AUTH_ROUTE, {
          replace: true,
          state: { redirectTo: "/player" },
        });
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server did not return JSON.");
      }
      if (!res.ok) throw new Error(data.message || "Failed to add entry");

      // success → go to the new Player page
      navigate(`/player/${data._id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-300 text-white
px-6"
    >
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

        {/* New Input Row */}
        <form
          onSubmit={handleAddAndGo}
          className="flex w-full max-w-2xl mx-auto items-stretch gap-3 mb-6"
        >
          <input
            type="url"
            required
            placeholder="Paste a YouTube video or playlist URL…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-xl px-4 py-3 text-gray-900 outline-none shadow-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-white text-gray-900 font-bold shadow-md hover:scale-90 transform transition disabled:opacity-60"
          >
            {loading ? "Adding…" : "Watch"}
          </button>
        </form>
        {err && <p className="text-sm text-red-200 mb-4">{err}</p>}

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

      {/* Features Section */}
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

      {/* Footer */}
      <footer className="mt-20 text-sm opacity-70">
        © {new Date().getFullYear()} LearnStream — Learn Smarter, Not Harder 🚀
      </footer>
    </div>
  );
}
