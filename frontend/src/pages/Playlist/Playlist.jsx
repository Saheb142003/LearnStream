// frontend/src/pages/Playlist/Playlist.jsx
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AddPlaylistForm from "./AddPlaylistForm";
import PlaylistList from "./PlaylistList";
import { AuthContext } from "../../context/AuthContext";
import SEO from "../../components/SEO";

const BASE_URL = "";

export default function Playlist() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        // 🔑 Directly send user to Google OAuth login page
        window.location.href = `${BASE_URL}/auth/google`;
        return;
      }
      fetchMyPlaylists();
    }
  }, [authLoading, isAuthenticated]);

  const fetchMyPlaylists = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/playlists`, {
        credentials: "include",
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server did not return JSON! Check backend.");
      }
      if (!res.ok) throw new Error(data.message || "Failed to fetch playlists");
      setPlaylists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async ({ videoId, playlistId }) => {
    setError("");
    setLoading(true);

    const body = { videoId, playlistId };

    try {
      const res = await fetch(`${BASE_URL}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      let newPlaylist;
      try {
        newPlaylist = await res.json();
      } catch {
        throw new Error("Server did not return JSON! Check backend.");
      }
      if (!res.ok)
        throw new Error(newPlaylist.message || "Failed to add playlist/video");
      setPlaylists((prev) => [...prev, newPlaylist]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to remove this playlist?"))
      return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/playlists/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove playlist");
      }
      setPlaylists((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id) => {
    navigate(`/video/${id}`);
  };

  if (authLoading) {
    return (
      <p className="text-center text-indigo-500 animate-pulse">
        Checking login...
      </p>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <SEO
        title="Your Video Library & Playlists"
        description="Manage your saved educational playlists, courses, and interactive video notes on LearnStream."
        url="/playlist"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Playlists", path: "/playlist" },
        ]}
      />

      <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">
        Your Playlists & Videos
      </h2>

      <AddPlaylistForm onAdd={handleAdd} />

      {error && (
        <div className="my-4 max-w-2xl mx-auto p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-left flex items-start gap-3.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white shrink-0 flex items-center justify-center shadow-xs mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-amber-900 mb-0.5">
              Unable to Add Content
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-amber-500 hover:text-amber-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <PlaylistList
        playlists={playlists}
        loading={loading}
        onSelect={handleSelect}
        onRemove={handleRemove}
      />
    </div>
  );
}
