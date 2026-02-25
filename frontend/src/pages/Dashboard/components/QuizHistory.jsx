import React from "react";
import { Trophy, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

const QuizHistory = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center py-12">
        <p className="text-gray-400">No quizzes taken yet.</p>
      </div>
    );
  }

  // Sort by date desc
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Quizzes</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[9px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="pb-1.5 pl-3">Date</th>
              <th className="pb-1.5">Video / Topic</th>
              <th className="pb-1.5">Difficulty</th>
              <th className="pb-1.5 text-center">Score</th>
              <th className="pb-1.5 pr-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedHistory.map((quiz, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 pl-3 text-sm text-gray-500 font-medium whitespace-nowrap">
                  {new Date(quiz.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="py-2.5 pr-2 text-sm font-medium text-gray-800">
                  {quiz.videoId ? (
                    <Link
                      to={`/player/${quiz.videoId}`}
                      className="hover:text-indigo-600 hover:underline transition-colors line-clamp-1"
                    >
                      {quiz.videoTitle || "Unknown Video"}
                    </Link>
                  ) : (
                    <span className="line-clamp-1">
                      {quiz.videoTitle || "Unknown Video"}
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-sm">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      quiz.difficulty === "hard"
                        ? "bg-red-100 text-red-700"
                        : quiz.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {quiz.difficulty || "medium"}
                  </span>
                </td>
                <td className="py-2.5 text-sm font-bold text-gray-700 text-center">
                  {quiz.score} / {quiz.totalQuestions}
                </td>
                <td className="py-2.5 pr-3 text-right">
                  {quiz.score / quiz.totalQuestions >= 0.6 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-md">
                      <Trophy size={14} /> P
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 text-sm font-bold bg-red-50 px-2 py-1 rounded-md">
                      <XCircle size={14} /> F
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuizHistory;
