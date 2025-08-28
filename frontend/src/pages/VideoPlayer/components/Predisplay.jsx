import React from "react";

const Predisplay = () => {
  return (
    <div className="p-3 rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2 underline">How to start:</h3>
      <ul className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
        <li>Click 📖 Transcribe to generate transcript</li>
        <li>Then click ✨ Summarize</li>
        <li>Finally, click 🧠 Quizzify</li>
      </ul>
    </div>
  );
};

export default Predisplay;
