// frontend/src/pages/Feed/ErrorMessage.jsx
export default function ErrorMessage({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="text-6xl mb-4">⚠️</div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h2>

        <p className="text-gray-600 mb-6">
          {error || "We couldn't load your video feed. Please try again."}
        </p>

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = "/playlist")}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Go to Playlists
          </button>
        </div>
      </div>
    </div>
  );
}
