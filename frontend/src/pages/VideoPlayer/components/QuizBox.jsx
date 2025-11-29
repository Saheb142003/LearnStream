// frontend/src/pages/VideoPlayer/components/QuizBox.jsx
import React from "react";

import { useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";

const QuizBox = ({ quiz, loading, onRetry, onQuizComplete }) => {
  const [difficulty, setDifficulty] = useState("medium");
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleOptionSelect = (qIndex, optIndex) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const checkAnswers = () => {
    setShowResults(true);
    const score = quiz.reduce((acc, q, i) => {
      return acc + (answers[i] === q.correctAnswer ? 1 : 0);
    }, 0);

    if (onQuizComplete) {
      onQuizComplete(score, quiz.length, difficulty);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setShowResults(false);
    onRetry(difficulty);
  };

  if (loading) {
    return (
      <div className="p-5 border rounded-2xl bg-white shadow-lg shadow-indigo-50/50 min-h-[200px] flex flex-col items-center justify-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="font-medium text-gray-600">
          Generating quiz ({difficulty})...
        </p>
      </div>
    );
  }

  if (!quiz || quiz.length === 0) {
    return (
      <div className="p-5 border rounded-2xl bg-white shadow-lg shadow-indigo-50/50 min-h-[200px] flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-emerald-500">🧠</span> Generate Quiz
        </h3>

        <div className="flex gap-2 mb-6">
          {["easy", "medium", "hard"].map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                difficulty === level
                  ? "bg-emerald-500 text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <button
          onClick={() => onRetry(difficulty)}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="text-lg">⚡</span> Generate Quiz
        </button>
      </div>
    );
  }

  const score = quiz.reduce((acc, q, i) => {
    return acc + (answers[i] === q.correctAnswer ? 1 : 0);
  }, 0);

  return (
    <div className="p-5 border rounded-2xl bg-white shadow-lg shadow-indigo-50/50 min-h-[200px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-emerald-500">🧠</span> Quiz
        </h3>
        <button
          onClick={resetQuiz}
          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
          title="Regenerate Quiz"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {quiz.map((q, i) => (
          <div
            key={i}
            className="p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <p className="font-medium text-gray-800 mb-3">
              {i + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, optIndex) => {
                const isSelected = answers[i] === optIndex;
                const isCorrect = q.correctAnswer === optIndex;
                let btnClass =
                  "w-full text-left p-3 rounded-lg text-sm transition-all border ";

                if (showResults) {
                  if (isCorrect)
                    btnClass +=
                      "bg-green-100 border-green-300 text-green-800 font-medium";
                  else if (isSelected)
                    btnClass += "bg-red-50 border-red-200 text-red-700";
                  else
                    btnClass +=
                      "bg-white border-gray-200 text-gray-500 opacity-60";
                } else {
                  if (isSelected)
                    btnClass +=
                      "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium ring-1 ring-emerald-200";
                  else
                    btnClass +=
                      "bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300";
                }

                return (
                  <button
                    key={optIndex}
                    onClick={() => handleOptionSelect(i, optIndex)}
                    disabled={showResults}
                    className={btnClass}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {showResults && isCorrect && (
                        <Check size={16} className="text-green-600" />
                      )}
                      {showResults && isSelected && !isCorrect && (
                        <X size={16} className="text-red-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!showResults ? (
        <button
          onClick={checkAnswers}
          disabled={Object.keys(answers).length < quiz.length}
          className={`w-full mt-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
            Object.keys(answers).length < quiz.length
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 active:scale-95"
          }`}
        >
          Check Answers
        </button>
      ) : (
        <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
          <p className="text-lg font-bold text-emerald-800">
            You scored {score} / {quiz.length}
          </p>
          <p className="text-emerald-600 text-sm mt-1">
            {score === quiz.length ? "Perfect! 🎉" : "Keep learning! 📚"}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizBox;
