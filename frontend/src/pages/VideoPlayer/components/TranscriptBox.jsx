import React from "react";

const TranscriptBox = ({ transcript }) => {
  return (
    <div className="p-3 border rounded-lg bg-gray-50 max-h-80 overflow-y-auto">
      <h3 className="font-semibold mb-2">Transcript</h3>
      <pre className="whitespace-pre-wrap text-sm text-gray-700">
        {transcript || "No transcript loaded yet."}
      </pre>
    </div>
  );
};

export default TranscriptBox;
