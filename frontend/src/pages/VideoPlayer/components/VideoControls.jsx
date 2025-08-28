// frontend/src/pages/VideoPlayer/components/VideoControls.jsx
import React from "react";

const VideoControls = ({
  viewMode,
  setViewMode,
  onTranscribe,
  transcriptLoading,
  activeVideoId,
}) => {
  const transcribeDisabled = transcriptLoading || !activeVideoId;

  return (
    <div className="flex gap-2 mb-4">
      <button
        type="button"
        onClick={() => {
          setViewMode("transcript");
          if (onTranscribe && !transcribeDisabled) onTranscribe();
        }}
        disabled={transcribeDisabled}
        aria-label="Show transcript"
        className={`px-3 py-2 rounded-lg transition-colors ${
          viewMode === "transcript"
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 hover:bg-gray-200"
        } ${transcribeDisabled ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {transcriptLoading ? "⏳ Transcribing…" : "📖 Transcribe"}
      </button>

      <button
        type="button"
        onClick={() => setViewMode("summary")}
        aria-label="Show summary"
        className={`px-3 py-2 rounded-lg transition-colors ${
          viewMode === "summary"
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        ✨ Summarize
      </button>

      <button
        type="button"
        onClick={() => setViewMode("quiz")}
        aria-label="Start quiz"
        className={`px-3 py-2 rounded-lg transition-colors ${
          viewMode === "quiz"
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        🧠 Quizzify
      </button>
    </div>
  );
};

export default VideoControls;
