import React from "react";

const SummaryBox = ({ summary }) => {
  return (
    <div className="p-3 border rounded-lg bg-gray-50 max-h-80 overflow-y-auto">
      <h3 className="font-semibold mb-2">Summary</h3>
      <p className="text-sm text-gray-700">
        {summary || "Click summarize to generate summary (to be implemented)."}
      </p>
    </div>
  );
};

export default SummaryBox;
