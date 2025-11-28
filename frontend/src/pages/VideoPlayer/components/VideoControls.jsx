import React from "react";
import { motion } from "framer-motion";

const VideoControls = ({
  viewMode,
  setViewMode,
  onTranscribe,
  transcriptLoading,
  activeVideoId,
}) => {
  const transcribeDisabled = transcriptLoading || !activeVideoId;

  return (
    <div className="flex gap-3 mb-6">
      <motion.button
        whileHover={!transcribeDisabled ? { scale: 1.02 } : {}}
        whileTap={!transcribeDisabled ? { scale: 0.98 } : {}}
        type="button"
        onClick={() => {
          setViewMode("transcript");
          if (onTranscribe && !transcribeDisabled) onTranscribe();
        }}
        disabled={transcribeDisabled}
        aria-label="Show transcript"
        className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm min-w-[160px] ${
          viewMode === "transcript"
            ? "bg-indigo-600 text-white shadow-indigo-200"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        } ${transcribeDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <span>{transcriptLoading ? "⏳" : "📖"}</span>
        <span>{transcriptLoading ? "Transcribing..." : "Transcribe"}</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => setViewMode("summary")}
        aria-label="Show summary"
        className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
          viewMode === "summary"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        ✨ Summarize
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => setViewMode("quiz")}
        aria-label="Start quiz"
        className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
          viewMode === "quiz"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        🧠 Quizzify
      </motion.button>
    </div>
  );
};

export default VideoControls;
