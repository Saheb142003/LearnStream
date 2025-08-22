// frontend/src/pages/Playlist/PlaylistDetails.jsx
import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5000";

export default function PlaylistDetails({ playlistId }) {
  const [videos, setVideos] = useState([]);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!playlistId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${BASE_URL}/api/playlists/${playlistId}`, {
          credentials: "include",
        });
        let data;
        try {
          data = await res.json();
        } catch (err) {
          throw new Error(
            "Server did not return JSON! Check backend status.",
            err
          );
        }
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch playlist details");
        setPlaylistTitle(data.title || "Untitled Playlist");
        setVideos(data.videos || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [playlistId]);

  if (loading) return <p>Loading playlist videos...</p>;
  if (error) return <p className="text-red-600 font-semibold mt-4">{error}</p>;

  if (videos.length === 0)
    return <p className="mt-4">Playlist has no videos to show.</p>;

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-3">{playlistTitle}</h3>
      <ul className="space-y-3 max-h-96 overflow-y-auto">
        {videos.map((vid) => (
          <li
            key={vid.videoId}
            className="flex items-center space-x-3 border-b pb-2 cursor-pointer hover:bg-gray-100"
            title={vid.title}
          >
            <img
              src={
                vid.thumbnail ||
                "https://via.placeholder.com/80x45?text=No+Image"
              }
              alt={vid.title}
              className="w-20 h-12 object-cover rounded"
            />
            <span className="text-sm">{vid.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
