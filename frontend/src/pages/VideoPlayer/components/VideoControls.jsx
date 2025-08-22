import React from "react";

const VideoControls = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setViewMode("transcript")}
        className={`px-3 py-2 rounded-lg ${
          viewMode === "transcript" ? "bg-indigo-600 text-white" : "bg-gray-100"
        }`}
      >
        📖 Transcript
      </button>
      <button
        onClick={() => setViewMode("summary")}
        className={`px-3 py-2 rounded-lg ${
          viewMode === "summary" ? "bg-indigo-600 text-white" : "bg-gray-100"
        }`}
      >
        ✨ Summarize
      </button>
      <button
        onClick={() => setViewMode("quiz")}
        className={`px-3 py-2 rounded-lg ${
          viewMode === "quiz" ? "bg-indigo-600 text-white" : "bg-gray-100"
        }`}
      >
        🧠 Quizzify
      </button>
    </div>
  );
};

export default VideoControls;
