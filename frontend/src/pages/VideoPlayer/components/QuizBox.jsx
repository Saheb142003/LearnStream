// frontend/src/pages/VideoPlayer/components/QuizBox.jsx
import React from "react";

const QuizBox = ({ quiz }) => {
  return (
    <div className="p-3 border rounded-lg bg-gray-50 max-h-80 overflow-y-auto">
      <h3 className="font-semibold mb-2">Quiz</h3>
      {quiz.length > 0 ? (
        <ul className="list-disc list-inside text-sm text-gray-700">
          {quiz.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No quiz generated yet.</p>
      )}
    </div>
  );
};

export default QuizBox;
