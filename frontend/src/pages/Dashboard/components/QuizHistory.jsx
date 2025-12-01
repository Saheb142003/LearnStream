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
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Quizzes</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="pb-4 pl-4">Date</th>
              <th className="pb-4">Video / Topic</th>
              <th className="pb-4">Difficulty</th>
              <th className="pb-4">Score</th>
              <th className="pb-4 pr-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedHistory.map((quiz, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 pl-4 text-sm text-gray-600">
                  {new Date(quiz.date).toLocaleDateString()}
                </td>
                <td className="py-4 text-sm font-medium text-gray-800">
                  {quiz.videoId ? (
                    <Link
                      to={`/player/${quiz.videoId}`}
                      className="hover:text-indigo-600 hover:underline transition-colors"
                    >
                      {quiz.videoTitle || "Unknown Video"}
                    </Link>
                  ) : (
                    quiz.videoTitle || "Unknown Video"
                  )}
                </td>
                <td className="py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                <td className="py-4 text-sm font-bold text-gray-700">
                  {quiz.score} / {quiz.totalQuestions}
                </td>
                <td className="py-4 pr-4 text-right">
                  {quiz.score / quiz.totalQuestions >= 0.6 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                      <Trophy size={16} /> Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 text-sm font-medium">
                      <XCircle size={16} /> Failed
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
