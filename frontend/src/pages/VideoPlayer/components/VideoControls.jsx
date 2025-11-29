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
  const transcribeDisabled = transcriptLoading || !activeVideoId;
  const summaryDisabled = summaryLoading || !hasTranscript;
  // const quizDisabled = quizLoading || !hasTranscript; // Unused variable removed

  const buttons = [
    {
      id: "transcript",
      label: transcriptLoading ? "Transcribing..." : "Transcribe",
      icon: transcriptLoading ? "⏳" : "📖",
      onClick: () => {
        setViewMode("transcript");
        if (onTranscribe && !transcribeDisabled && !hasTranscript)
          onTranscribe();
      },
      disabled: transcribeDisabled,
    },
    {
      id: "summary",
      label: summaryLoading ? "Summarizing..." : "Summarize",
      icon: summaryLoading ? "⏳" : "✨",
      onClick: () => {
        if (onSummarize && !summaryDisabled) onSummarize();
      },
      disabled: summaryDisabled,
    },
    {
      id: "quiz",
      label: quizLoading ? "Generating..." : "Quiz",
      icon: quizLoading ? "⏳" : "🧠",
      onClick: () => {
        setViewMode("quiz");
        // We let the QuizBox handle generation to allow difficulty selection
      },
      disabled: !hasTranscript,
    },
  ];

  return (
    <div className="flex flex-row gap-2 mb-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
      {buttons.map((btn) => {
        const isActive = viewMode === btn.id;
        return (
          <motion.button
            key={btn.id}
            whileHover={!btn.disabled ? { scale: 1.02 } : {}}
            whileTap={!btn.disabled ? { scale: 0.95 } : {}}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className={`relative flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 min-w-0 touch-manipulation active:scale-95 ${
              isActive
                ? "bg-white text-indigo-600 shadow-sm shadow-indigo-100 ring-1 ring-black/5"
                : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
            } ${btn.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <span className="text-base sm:text-lg shrink-0">{btn.icon}</span>
            <span className="text-xs sm:text-sm truncate">{btn.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute inset-0 rounded-lg sm:rounded-xl ring-2 ring-indigo-500/10 pointer-events-none"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default VideoControls;
