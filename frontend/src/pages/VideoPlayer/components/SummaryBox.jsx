// frontend/src/pages/VideoPlayer/components/SummaryBox.jsx
import React from "react";
import MarkdownRenderer from "./MarkdownRenderer";

const SummaryBox = ({ summary, loading }) => {
  return (
    <div className="p-0 lg:p-5 border-0 lg:border rounded-none lg:rounded-2xl bg-transparent lg:bg-white shadow-none lg:shadow-lg lg:shadow-indigo-50/50 min-h-[80px] lg:min-h-[200px] relative">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4 flex items-center gap-2">
        <span className="text-amber-500">✨</span> Summary
      </h3>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 sm:py-12 text-gray-500">
          <div className="animate-spin text-3xl mb-3">⏳</div>
          <p className="font-medium text-xs sm:text-sm text-gray-600">Generating summary...</p>
        </div>
      ) : summary ? (
        <div className="prose prose-sm max-w-none">
          <MarkdownRenderer content={summary} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 sm:py-12 text-gray-400">
          <span className="text-3xl mb-2 opacity-50">✨</span>
          <p className="font-medium text-xs sm:text-sm">
            Click "Summarize" to generate a summary.
          </p>
        </div>
      )}
    </div>
  );
};

export default SummaryBox;
