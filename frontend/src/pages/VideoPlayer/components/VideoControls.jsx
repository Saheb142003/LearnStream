import React from "react";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars

const VideoControls = ({
  viewMode,
  setViewMode,
  onTranscribe,
  onSummarize,

  transcriptLoading,
  summaryLoading,
  quizLoading,
  activeVideoId,
  hasTranscript,
  onQuizify, // eslint-disable-line no-unused-vars
}) => {
  const buttons = [
    {
      id: "transcript",
      label: transcriptLoading ? "Transcribing..." : "Transcribe",
      icon: transcriptLoading ? "⏳" : "📖",
      onClick: () => {
        setViewMode("transcript");
        if (onTranscribe && !hasTranscript && !transcriptLoading)
          onTranscribe();
      },
      disabled: !activeVideoId,
    },
    {
      id: "summary",
      label: summaryLoading ? "Summarizing..." : "Summarize",
      icon: summaryLoading ? "⏳" : "✨",
      onClick: () => {
        setViewMode("summary");
        if (onSummarize && !summaryLoading) onSummarize();
      },
      disabled: !activeVideoId,
    },
    {
      id: "quiz",
      label: quizLoading ? "Generating..." : "Quiz",
      icon: quizLoading ? "⏳" : "🧠",
      onClick: () => {
        setViewMode("quiz");
      },
      disabled: !activeVideoId,
    },
  ];

  return (
    <div 
      className="flex flex-row gap-2 py-1 mb-1 overflow-x-auto scrollbar-none shrink-0"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch"
      }}
    >
      {buttons.map((btn) => {
        const isActive = viewMode === btn.id;
        return (
          <motion.button
            key={btn.id}
            whileHover={!btn.disabled ? { scale: 1.02 } : {}}
            whileTap={!btn.disabled ? { scale: 0.95 } : {}}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 shrink-0 touch-manipulation active:scale-95 ${
              isActive
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            } ${btn.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <span className="text-sm shrink-0">{btn.icon}</span>
            <span className="truncate">{btn.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default VideoControls;
