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
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
          viewMode === "transcript"
            ? "bg-indigo-600 text-white shadow-indigo-200"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        } ${transcribeDisabled ? "opacity-60 cursor-not-allowed" : "active:scale-95"}`}
      >
        <span>{transcriptLoading ? "⏳" : "📖"}</span>
        {transcriptLoading ? "Transcribing..." : "Transcribe"}
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
