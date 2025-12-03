import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BASE_URL = "";

export default function VideoPlayer() {
  const { id } = useParams(); // playlist entry _id from DB
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${BASE_URL}/api/playlists/${id}`, {
          credentials: "include",
        });

        if (res.status === 401) {
          navigate("/profile", {
            replace: true,
            state: { redirectTo: `/video/${id}` },
          });
          return;
        }

        let data;
        try {
          data = await res.json();
        } catch {
          throw new Error("Server did not return JSON!");
        }
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch playlist");

        setPlaylist(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, navigate]);

  const getVideoThumbnail = (videoId) =>
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const sanitizedVideos = useMemo(() => {
    const items = Array.isArray(playlist?.videos) ? playlist.videos : [];
    const valid = items.filter(
      (v) =>
        v &&
        typeof v.videoId === "string" &&
        v.videoId.length === 11 &&
        v.title &&
        !/^private video$/i.test(v.title) &&
        !/^deleted video$/i.test(v.title)
    );
    // dedupe by videoId just in case
    const seen = new Set();
    return valid.filter((v) => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });
  }, [playlist]);

  const getTotalPlaylistDuration = () => {
    if (!sanitizedVideos.length) return null;
    const totalSeconds = sanitizedVideos.reduce((total, video) => {
      if (!video.duration) return total;
      const parts = video.duration.split(":").map(Number);
      if (parts.length === 2) return total + parts[0] * 60 + parts[1]; // mm:ss
      if (parts.length === 3)
        return total + parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
      return total;
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m total` : `${minutes}m total`;
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-indigo-600 animate-pulse">
        Loading playlist...
      </p>
    );

  if (error)
    return (
      <div className="text-center mt-10 text-red-600 font-semibold">
        {error} <br />
        <button
          onClick={() => navigate("/playlist")}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Go Back to Playlists
        </button>
      </div>
    );

  if (!playlist) return null;

  const totalDuration = getTotalPlaylistDuration();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-indigo-700">{playlist.title}</h2>
        {totalDuration && (
          <p className="text-gray-600 mt-2">
            {sanitizedVideos.length} videos • {totalDuration}
          </p>
        )}
      </div>

      {sanitizedVideos.length === 0 ? (
        <p className="italic text-gray-600">
          This playlist has no playable videos.
        </p>
      ) : (
        <ul className="space-y-4">
          {sanitizedVideos.map((video, index) => (
            <li
              key={video.videoId}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-indigo-50 cursor-pointer shadow-sm transition border border-gray-200"
              onClick={() => navigate(`/player/${id}?v=${video.videoId}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  navigate(`/player/${id}?v=${video.videoId}`);
              }}
              role="button"
              tabIndex={0}
            >
              {/* # */}
              <div className="text-gray-500 font-medium w-8 text-center">
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={getVideoThumbnail(video.videoId)}
                  alt={video.title || `Video ${index + 1}`}
                  className="w-32 h-18 object-cover rounded-md shadow"
                  onError={(e) => {
                    if (e.currentTarget.src.includes("hqdefault")) {
                      e.currentTarget.src = e.currentTarget.src.replace(
                        "hqdefault",
                        "mqdefault"
                      );
                    } else if (e.currentTarget.src.includes("mqdefault")) {
                      e.currentTarget.src =
                        "https://via.placeholder.com/120x68?text=No+Image";
                    }
                  }}
                />
                {video.duration && (
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                    {video.duration}
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900 line-clamp-2">
                  {video.title || `Video ${index + 1}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => navigate("/playlist")}
        className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Back to Playlists
      </button>
    </div>
  );
}
