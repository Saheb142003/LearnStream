// frontend/src/pages/VideoPlayer/components/QuizBox.jsx
import React from "react";

const QuizBox = ({ quiz }) => {
  return (
    <div className="p-5 border rounded-2xl bg-white shadow-lg shadow-indigo-50/50 min-h-[200px]">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-emerald-500">🧠</span> Quiz
      </h3>
      {quiz.length > 0 ? (
        <ul className="space-y-3">
          {quiz.map((q, i) => (
            <li key={i} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              {q}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <p className="font-medium">No quiz generated yet.</p>
        </div>
      )}
    </div>
  );
};

export default QuizBox;
