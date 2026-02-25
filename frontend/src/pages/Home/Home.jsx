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
  Lightbulb,
  Zap,
  Rocket,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const BackgroundSticker = ({
  icon: Icon,
  color,
  size,
  top,
  left,
  right,
  bottom,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{
      opacity: [0.3, 0.6, 0.3],
      y: [0, -40, 0],
      x: [0, 20, 0],
      rotate: [0, 10, -10, 0],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
    className={`absolute pointer-events-none hidden lg:block ${color}`}
    style={{ top, left, right, bottom }}
  >
    <Icon size={size} className="filter drop-shadow-md" />
  </motion.div>
);

// WaveText Component - Subtle Green Wave Animation
const WaveText = () => {
  const text1 = "Transform Video";
  const text2 = "Into Knowledge";

  const chars1 = text1.split("");
  const chars2 = text2.split("");

  const totalChars1 = chars1.length;
  const totalChars2 = chars2.length;
  const totalSteps = totalChars1 + totalChars2;

  const animationDuration = 3; // Fast snake loop

  const getCharAnimation = (isFirstLine, charIndex) => {
    let activeStep;

    if (isFirstLine) {
      activeStep = charIndex;
    } else {
      activeStep = totalChars1 + (totalChars2 - 1 - charIndex);
    }

    return {
      animationName: `waveChar${isFirstLine ? 1 : 2}_${charIndex}`,
      animationDuration: `${animationDuration}s`,
      animationIterationCount: "infinite",
      animationTimingFunction: "ease-in-out",
    };
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    let keyframesCSS = "";

    // Helper to generate smooth wave animation
    const generateKeyframes = (animName, activeStep) => {
      const stepDuration = 100 / totalSteps;

      const beforeStart = Math.max(0, activeStep * stepDuration - 0.5);
      const startPercent = activeStep * stepDuration;
      const risePercent = startPercent + stepDuration * 0.4;
      const peakPercent = startPercent + stepDuration * 0.6;
      const descendPercent = startPercent + stepDuration * 0.8;
      const midFadePercent = startPercent + stepDuration * 4;
      const endPercent = Math.min(startPercent + stepDuration * 8, 100);

      return `
        @keyframes ${animName} {
          0% { 
            color: #1f2937; 
            transform: translateY(0px);
          }
          ${beforeStart}% { 
            color: #1f2937; 
            transform: translateY(0px);
          }
          ${startPercent}% { 
            color: #166534; 
            transform: translateY(-2px);
          }
          ${startPercent + stepDuration * 0.5}% { 
            color: #052e16; 
            transform: translateY(-5px);
          }
          ${startPercent + stepDuration * 1}% { 
            color: #256d42ff; 
            transform: translateY(-4px);
          }
          ${startPercent + stepDuration * 1.5}% { 
            color: #166534; 
            transform: translateY(-3px);
          }
          ${startPercent + stepDuration * 2}% { 
            color: #166534; 
            transform: translateY(-2.5px);
          }
          ${startPercent + stepDuration * 2.5}% { 
            color: #15803d; 
            transform: translateY(-2px);
          }
          ${startPercent + stepDuration * 3}% { 
            color: #16a34a; 
            transform: translateY(-1.5px);
          }
          ${startPercent + stepDuration * 3.5}% { 
            color: #16a34a; 
            transform: translateY(-1px);
          }
          ${startPercent + stepDuration * 4.5}% { 
            color: #16a34a; 
            transform: translateY(-0.5px);
          }
          ${startPercent + stepDuration * 5.5}% { 
            color: #16a34a; 
            transform: translateY(0px);
          }
          ${startPercent + stepDuration * 6.5}% { 
            color: #16a34a; 
            transform: translateY(0px);
          }
          ${startPercent + stepDuration * 7.5}% { 
            color: #1f2937; 
            transform: translateY(0px);
          }
          100% { 
            color: #1f2937; 
            transform: translateY(0px);
          }
        }
      `;
    };

    // Generate keyframes for first line
    chars1.forEach((_, i) => {
      keyframesCSS += generateKeyframes(`waveChar1_${i}`, i);
    });

    // Generate keyframes for second line
    chars2.forEach((_, i) => {
      const activeStep = totalChars1 + (totalChars2 - 1 - i);
      keyframesCSS += generateKeyframes(`waveChar2_${i}`, activeStep);
    });

    styleSheet.textContent = keyframesCSS;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <h1
      className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-cursive tracking-tight mb-2 leading-none pb-2"
      style={{
        fontFamily: "'LocalHeadingFont', 'Dancing Script', cursive",
      }}
    >
      <span className="whitespace-nowrap" style={{ display: "inline-block" }}>
        {chars1.map((char, i) => (
          <span
            key={`char1-${i}`}
            style={{
              display: "inline-block",
              willChange: "transform, color",
              ...getCharAnimation(true, i),
              whiteSpace: char === " " ? "pre" : "normal",
            }}
          >
            {char}
          </span>
        ))}
      </span>
      <br />
      <span className="whitespace-nowrap" style={{ display: "inline-block" }}>
        {chars2.map((char, i) => (
          <span
            key={`char2-${i}`}
            style={{
              display: "inline-block",
              willChange: "transform, color",
              ...getCharAnimation(false, i),
              whiteSpace: char === " " ? "pre" : "normal",
            }}
          >
            {char}
          </span>
        ))}
      </span>
    </h1>
  );
};

const BASE_URL = "";
const AUTH_ROUTE = "/profile";

function isYouTubeUrl(value) {
  if (!value) return false;
  const trimmed = value.trim();
  return /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/playlist\?list=)/i.test(
    trimmed,
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
              JSON.stringify({ type: "player", url: trimmed }),
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
            data.message || `Server responded with ${res.status}`,
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
    [url, navigate],
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

      {/* Hero Section */}
      <section className="relative pt-4 pb-12 lg:pt-12 lg:pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <WaveText />

            {/* Short version for mobile */}
            <p className="block sm:hidden text-base text-gray-600 mb-6 max-w-xl mx-auto leading-relaxed font-medium">
              Turn videos into interactive learning with AI-powered tools.
            </p>

            {/* Full version for desktop */}
            <p className="hidden sm:block text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed font-medium">
              Stop watching passively. Turn any YouTube video into an
              interactive learning experience with
              <span className="text-indigo-600 font-bold"> transcripts</span>,
              <span className="text-indigo-600 font-bold"> summaries</span>, and
              <span className="text-indigo-600 font-bold"> quizzes</span>.
            </p>
          </motion.div>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-3xl mx-auto relative group z-20"
          >
            {/* Animated Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt" />

            <form
              onSubmit={handleAddAndGo}
              className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white/90 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/50 ring-1 ring-gray-900/5 gap-2 sm:gap-0 transform transition-transform"
            >
              <div className="flex-1 flex items-center w-full">
                <div className="pl-3 sm:pl-5 text-indigo-500">
                  <Youtube className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-sm" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube video or playlist URL..."
                  className="flex-1 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:ring-0 px-4 sm:px-5 py-4 text-base sm:text-lg w-full min-w-0 font-medium"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors mr-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <span>Start Learning</span>
                    <ArrowRight className="w-5 h-5" />
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
