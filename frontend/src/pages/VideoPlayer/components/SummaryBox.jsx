// frontend/src/pages/VideoPlayer/components/SummaryBox.jsx
import React from "react";

const SummaryBox = ({ summary }) => {
  return (
    <div className="p-5 border rounded-2xl bg-white shadow-lg shadow-indigo-50/50 min-h-[200px]">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-amber-500">✨</span> Summary
      </h3>
      <p className="text-sm text-gray-700 leading-relaxed">
        {summary || "Click summarize to generate summary (to be implemented)."}
      </p>
    </div>
  );
};

export default SummaryBox;
