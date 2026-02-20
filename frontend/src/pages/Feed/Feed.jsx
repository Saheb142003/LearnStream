import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VideoCard from "./VideoCard";
import PlaylistCard from "./PlaylistCard";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import FilterBar from "./FilterBar";

const BASE_URL = "";

// Module-level cache for persistence across navigation
let feedCache = {
  items: [],
  hasMore: true,
  seed: null,
  scrollPos: 0,
  searchQuery: "",
  activeFilter: "all",
};

export default function Feed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(feedCache.searchQuery || "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    feedCache.searchQuery || "",
  );
  const [activeFilter, setActiveFilter] = useState(
    feedCache.activeFilter || "all",
  );
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();
  const seedRef = useRef(
    feedCache.seed || String(Math.floor(Math.random() * 1e9)),
  );
  const mountedRef = useRef(false);

  // Search is now triggered on "Enter" inside FilterBar,
  // bypassing the debounce timer.

  const fetchVideos = useCallback(
    async (isLoadMore = false) => {
      if (loading) return;

      setLoading(true);
      if (!isLoadMore) setError("");

      try {
        const offset = isLoadMore ? items.length : 0;
        const params = new URLSearchParams({
          search: debouncedSearch,
          limit: "20",
          offset: offset.toString(),
          seed: seedRef.current,
          type: activeFilter,
        });

        const res = await fetch(`${BASE_URL}/api/feed?${params}`);

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch feed");

        setItems((prev) => {
          const newItems = isLoadMore ? [...prev, ...data.videos] : data.videos;
          return newItems;
        });
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        setError(err.message || "Failed to fetch feed");
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, activeFilter, items.length, loading],
  );

  // Initial Load & Persistence Restore
  useEffect(() => {
    mountedRef.current = true;

    // If we have cached items and the search hasn't changed (or is empty match), restore
    if (
      feedCache.items.length > 0 &&
      feedCache.searchQuery === debouncedSearch &&
      feedCache.activeFilter === activeFilter
    ) {
      setItems(feedCache.items);
      setHasMore(feedCache.hasMore);
      seedRef.current = feedCache.seed;

      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, feedCache.scrollPos);
      }, 50);
    } else {
      // No cache or search changed -> fetch fresh
      fetchVideos(false);
    }

    return () => {
      // Save scroll position on unmount
      feedCache.scrollPos = window.scrollY;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // React to Debounced Search Change OR Filter Change
  useEffect(() => {
    if (!mountedRef.current) return;

    if (
      debouncedSearch !== feedCache.searchQuery ||
      activeFilter !== feedCache.activeFilter
    ) {
      seedRef.current = String(Math.floor(Math.random() * 1e9));
      setItems([]);
      setHasMore(true);
      fetchVideos(false);
      feedCache.searchQuery = debouncedSearch;
      feedCache.activeFilter = activeFilter;
      feedCache.scrollPos = 0; // Reset scroll for new search
    }
  }, [debouncedSearch, activeFilter, fetchVideos]);

  // Update cache whenever items change
  useEffect(() => {
    if (items.length > 0) {
      feedCache.items = items;
      feedCache.hasMore = hasMore;
      feedCache.seed = seedRef.current;
    }
  }, [items, hasMore]);

  const handleVideoClick = (video) => {
    navigate(`/player/${video.videoId}`, { state: { video } });
  };

  const handlePlaylistClick = (playlist) => {
    // Navigate to dedicated playlist view
    navigate(`/playlist/${playlist.playlistId}`);
  };

  const loadMore = () => {
    if (hasMore && !loading) fetchVideos(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section (Search bar + Filter Chips) */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-10 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery} // Updates immediate state for UI
            setDebouncedSearch={setDebouncedSearch} // Triggered only on Enter
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {loading && items.length === 0 ? (
          <LoadingSpinner />
        ) : error && items.length === 0 ? (
          <ErrorMessage error={error} onRetry={() => fetchVideos(false)} />
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📺</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No Content Found
            </h2>
            <p className="text-gray-500 mb-6">
              {debouncedSearch
                ? "Try adjusting your search query"
                : "Start by adding some playlists to see content here"}
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
              {items.map((item) =>
                item.type === "playlist" ? (
                  <PlaylistCard
                    key={`pl-${item.playlistId}`}
                    playlist={item}
                    onClick={() => handlePlaylistClick(item)}
                  />
                ) : (
                  <VideoCard
                    key={`vid-${item.videoId}-${item.playlistId}`}
                    video={item}
                    onClick={() => handleVideoClick(item)}
                  />
                ),
              )}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
