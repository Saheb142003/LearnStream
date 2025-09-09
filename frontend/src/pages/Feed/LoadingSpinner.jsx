// frontend/src/pages/Feed/LoadingSpinner.jsx
export default function LoadingSpinner() {
  // Render a skeleton grid that resembles the video cards (better UX than blank spinner)
  const skeletons = Array.from({ length: 12 });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {skeletons.map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden shadow-sm"
            >
              <div className="bg-gray-200 aspect-video w-full" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-gray-200 mr-3" />
                  <div className="space-y-2 w-full">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 font-medium">
            Loading your video feed...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Gathering videos from playlists
          </p>
        </div>
      </div>
    </div>
  );
}
