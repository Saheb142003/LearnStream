/* eslint-disable no-unused-vars */
// frontend/src/pages/Home/Home.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  FileText,
  BrainCircuit,
  ArrowRight,
  Clipboard,
  X,
  Youtube,
  Sparkles,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const BASE_URL = "";
const AUTH_ROUTE = "/profile";

function isYouTubeUrl(value) {
  if (!value) return false;
  const trimmed = value.trim();
  return /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/playlist\?list=)/i.test(
    trimmed
  );
}

// 3D Card Component (Light Theme)
const FeatureCard = ({ icon: Icon, title, desc, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10, rotateX: 5, rotateY: 5 }}
      className="group relative p-8 rounded-3xl bg-white border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();
  const abortRef = useRef(null);
  const { scrollY } = useScroll();

  // Parallax effects
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

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
          try {
            sessionStorage.setItem(
              "afterAuthRedirect",
              JSON.stringify({ type: "player", url: trimmed })
            );
          } catch (e) {
            console.warn("Could not save pending redirect", e);
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
        if (err.name === "AbortError") return;
        setErr(err.message || "Failed to add playlist.");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [url, navigate]
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-indigo-100 overflow-x-hidden font-sans">
      {/* Background Gradients (Light) */}
      <Helmet>
        <title>LearnStream - Transform Video Into Knowledge</title>
        <meta
          name="description"
          content="Turn any YouTube video into an interactive learning experience with transcripts, summaries, and quizzes."
        />
        <link rel="canonical" href="https://learnstream.netlify.app/" />
      </Helmet>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-sm font-medium text-indigo-600">
                AI-Powered Learning Assistant
              </span>
            </div>

            <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-tight text-gray-900">
              Transform Video <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Into Knowledge
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop watching passively. Turn any YouTube video into an
              interactive learning experience with
              <span className="text-indigo-600 font-semibold">
                {" "}
                transcripts
              </span>
              ,<span className="text-indigo-600 font-semibold"> summaries</span>
              , and
              <span className="text-indigo-600 font-semibold"> quizzes</span>.
            </p>
          </motion.div>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-2xl mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
            <form
              onSubmit={handleAddAndGo}
              className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl p-2 shadow-xl border border-gray-100 gap-2 sm:gap-0"
            >
              <div className="flex-1 flex items-center w-full">
                <div className="pl-2 sm:pl-4 text-gray-400">
                  <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube URL..."
                  className="flex-1 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:ring-0 px-3 sm:px-4 py-3 text-base sm:text-lg w-full min-w-0"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <span>Start</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Helper Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500"
          >
            <button
              onClick={handlePaste}
              className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
            >
              <Clipboard className="w-4 h-4" />
              Paste from clipboard
            </button>
            <span>•</span>
            <button
              onClick={() =>
                setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
              }
              className="hover:text-indigo-600 transition-colors"
            >
              Try sample video
            </button>
          </motion.div>

          {/* Error/Info Messages */}
          <div className="mt-6 h-6">
            {err && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 font-medium"
              >
                {err}
              </motion.p>
            )}
          </div>
        </div>

        {/* 3D Floating Elements (Light Theme) */}
        <motion.div
          style={{ y: y1 }}
          className="absolute top-1/4 left-10 lg:left-20 hidden lg:block opacity-40 pointer-events-none"
        >
          <FileText className="w-32 h-32 text-indigo-300 rotate-12" />
        </motion.div>
        <motion.div
          style={{ y: y2 }}
          className="absolute top-1/3 right-10 lg:right-20 hidden lg:block opacity-40 pointer-events-none"
        >
          <BrainCircuit className="w-40 h-40 text-purple-300 -rotate-12" />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Everything you need to <br />
              master any topic
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Our AI analyzes the video content to provide you with
              comprehensive learning tools instantly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Play}
              title="Distraction Free"
              desc="Watch videos in a clean, focused environment designed purely for learning, with no sidebar distractions."
              delay={0}
            />
            <FeatureCard
              icon={FileText}
              title="Smart Transcripts"
              desc="Get accurate, time-synced transcripts. Search through the video content like a document."
              delay={0.2}
            />
            <FeatureCard
              icon={BrainCircuit}
              title="AI Quizzes"
              desc="Test your knowledge immediately with AI-generated quizzes based on the video's key concepts."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Footer removed - using global footer */}
    </div>
  );
}
