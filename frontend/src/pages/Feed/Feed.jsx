import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VideoCard from "./VideoCard";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import FilterBar from "./FilterBar";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();
  const seedRef = useRef(String(Math.floor(Math.random() * 1e9))); // session seed
  const mountedRef = useRef(false);

  // If user changes search, reset feed and create a new seed
  useEffect(() => {
    if (!mountedRef.current) return;
    seedRef.current = String(Math.floor(Math.random() * 1e9));
    setVideos([]);
    setHasMore(true);
    fetchVideos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    mountedRef.current = true;
    fetchVideos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVideos = useCallback(
    async (isLoadMore = false) => {
      if (loading) return;

      setLoading(true);
      if (!isLoadMore) setError("");

      try {
        const offset = isLoadMore ? videos.length : 0;
        const params = new URLSearchParams({
          search: searchQuery,
          limit: "20",
          offset: offset.toString(),
          seed: seedRef.current,
        });

        const res = await fetch(`${BASE_URL}/api/feed?${params}`, {
          credentials: "include",
        });

        if (res.status === 401) {
          navigate("/profile", {
            replace: true,
            state: { redirectTo: "/feed" },
          });
          return;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch feed");

        setVideos((prev) =>
          isLoadMore ? [...prev, ...data.videos] : data.videos
        );
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        setError(err.message || "Failed to fetch feed");
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, videos.length, loading, navigate]
  );

  const handleVideoClick = (video) => {
    navigate(`/player/${video.videoId}`);
  };

  const loadMore = () => {
    if (hasMore && !loading) fetchVideos(true);
  };

  if (loading && videos.length === 0) return <LoadingSpinner />;
  if (error && videos.length === 0)
    return <ErrorMessage error={error} onRetry={() => fetchVideos(false)} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section (only search bar now) */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-end">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📺</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No Videos Found
            </h2>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "Start by adding some playlists to see videos here"}
            </p>
            <button
              onClick={() => navigate("/playlist")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Add Playlists
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={`${video.videoId}-${video.uploaderId}`}
                  video={video}
                  onClick={() => handleVideoClick(video)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {loading ? "Loading..." : "Load More Videos"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
