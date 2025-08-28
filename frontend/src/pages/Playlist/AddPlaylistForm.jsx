// frontend/src/pages/Playlist/AddPlaylistForm.jsx
import { useState } from "react";

export default function AddPlaylistForm({ onAdd }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  // Extract videoId or playlistId from YouTube URL
  const extractIds = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === "youtu.be" && urlObj.pathname.length > 1) {
        // Short link, videoId after '/'
        return { videoId: urlObj.pathname.slice(1) };
      } else if (["www.youtube.com", "youtube.com"].includes(urlObj.hostname)) {
        const v = urlObj.searchParams.get("v");
        const list = urlObj.searchParams.get("list");
        if (list && v) return { videoId: v, playlistId: list };
        if (list) return { playlistId: list };
        if (v) return { videoId: v };
      }
      return {};
    } catch (e) {
      return { e };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const { videoId, playlistId } = extractIds(input);

    if (!videoId && !playlistId) {
      setError("Please enter a valid YouTube video or playlist link.");
      return;
    }

    // Pass IDs upward
    onAdd({ videoId, playlistId });
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 ml-55">
      <label className="block mb-2 font-semibold">
        Add YouTube Video or Playlist Link
      </label>
      <input
        type="text"
        placeholder="Paste YouTube video or playlist URL"
        className="w-180 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        required
      />
      {error && <p className="text-red-500 mt-1">{error}</p>}
      <button
        type="submit"
        className="mt-3 ml-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add
      </button>
    </form>
  );
}
