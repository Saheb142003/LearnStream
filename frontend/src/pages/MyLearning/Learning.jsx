import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Clock, AlertCircle, BookOpen, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import SkeletonLoader from "../../components/SkeletonLoader";

const BASE_URL = "";

export default function Learning() {
  const { isAuthenticated, startGoogleSignIn } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState({
    continueWatching: [],
    smartReview: [],
  });
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      startGoogleSignIn();
      return;
    }

    const fetchData = async () => {
      try {
        const [historyRes, playlistsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/user/learning-history`, {
            credentials: "include",
          }),
          fetch(`${BASE_URL}/api/playlists`, { credentials: "include" }),
        ]);

        if (!historyRes.ok || !playlistsRes.ok) {
          throw new Error("Failed to load learning data");
        }

        const historyData = await historyRes.json();
        const playlistsData = await playlistsRes.json();

        setHistory(historyData);
        setPlaylists(playlistsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load your learning progress.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, startGoogleSignIn]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 lg:p-10 space-y-8">
        <div className="max-w-7xl mx-auto">
          <SkeletonLoader className="h-10 w-64 mb-8" />
          <div className="grid gap-6">
            <SkeletonLoader className="h-48 w-full rounded-2xl" />
            <SkeletonLoader className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 pt-10 pb-16 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            My Learning
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Welcome back! Pick up where you left off or review concepts to
            master them.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 -mt-8 space-y-12">
        {/* Section 1: Continue Watching */}
        {history.continueWatching.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Continue Watching
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x custom-scrollbar">
              {history.continueWatching.map((item) => (
                <Link
                  key={item.videoId}
                  to={`/player/${item.playlistId || item.videoId}${
                    item.playlistId ? `?v=${item.videoId}` : ""
                  }`}
                  className="snap-start shrink-0 w-72 group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={
                        item.thumbnailUrl ||
                        `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <Play size={18} className="text-indigo-600 ml-1" />
                      </div>
                    </div>
                    {/* Progress Bar (Simulated for now, could be real if we tracked %) */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div className="h-full bg-indigo-600 w-1/3" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                      {item.title || "Untitled Video"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Last watched:{" "}
                      {new Date(item.lastWatched).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Smart Review */}
        {history.smartReview.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-900">Smart Review</h2>
            </div>
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <p className="text-amber-800 mb-6">
                We noticed you might need a refresher on these topics based on
                your recent quizzes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.smartReview.map((item) => (
                  <div
                    key={item.videoId + item.date}
                    className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-start gap-4"
                  >
                    <div className="shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 font-bold">
                      {Math.round((item.score / item.totalQuestions) * 100)}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                      <Link
                        to={`/player/${item.videoId}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        Review Now <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: My Playlists */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">My Playlists</h2>
            </div>
            <Link
              to="/playlist"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">
                You haven't created any playlists yet.
              </p>
              <Link
                to="/feed"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Explore Content
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {playlists.slice(0, 4).map((playlist) => (
                <Link
                  key={playlist._id}
                  to={`/playlist/${playlist._id}`}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-video bg-gray-100 relative">
                    {playlist.videos?.[0]?.thumbnailUrl ? (
                      <img
                        src={playlist.videos[0].thumbnailUrl}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen size={32} />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md">
                      {playlist.videos?.length || 0} videos
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Created{" "}
                      {new Date(playlist.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
