// frontend/src/pages/Playlist/AddPlaylistForm.jsx
import { useState } from "react";

export default function AddPlaylistForm({ onAdd }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const extractIds = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === "youtu.be" && urlObj.pathname.length > 1) {
        return { videoId: urlObj.pathname.slice(1) };
      } else if (["www.youtube.com", "youtube.com"].includes(urlObj.hostname)) {
        const v = urlObj.searchParams.get("v");
        const list = urlObj.searchParams.get("list");
        if (list && v) return { videoId: v, playlistId: list };
        if (list) return { playlistId: list };
        if (v) return { videoId: v };
      }
      return {};
    } catch {
      return {};
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
    onAdd({ videoId, playlistId });
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-col sm:flex-row justify-center items-start sm:items-end gap-3"
    >
      <div className="w-full sm:w-2/3 lg:w-1/2">
        <label className="block mb-2 font-semibold text-center sm:text-left">
          Add YouTube Video or Playlist Link
        </label>
        <input
          type="text"
          placeholder="Paste YouTube video or playlist URL"
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
        />
        {error && (
          <p className="text-red-500 mt-1 text-center sm:text-left">{error}</p>
        )}
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-center sm:self-auto"
      >
        Add
      </button>
    </form>
  );
}
