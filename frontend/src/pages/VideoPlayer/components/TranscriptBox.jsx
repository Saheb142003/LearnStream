// frontend/src/pages/VideoPlayer/components/TranscriptBox.jsx
import React from "react";

const TranscriptBox = ({ transcript, loading }) => {
  return (
    <div
      className="p-3 border rounded-lg bg-gray-50 max-h-[24rem] overflow-y-auto"
      role="log"
      aria-live="polite"
      tabIndex={0}
    >
      <pre className="whitespace-pre-wrap text-sm text-gray-700">
        {loading ? "⏳ Fetching transcript…" : transcript}
      </pre>
    </div>
  );
};

export default TranscriptBox;
