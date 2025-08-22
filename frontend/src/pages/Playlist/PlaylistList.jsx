import VideoItem from "./VideoItem";

export default function PlaylistList({ playlists, onSelect, onRemove }) {
  if (!playlists || playlists.length === 0) {
    return (
      <p className="text-gray-500 italic text-center mt-10">
        No playlists or videos added yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
      {playlists.map((item) => {
        const key = item._id || item.videoId; // ✅ fallback
        const navigateId = item._id || item.videoId; // ✅ support both cases

        return (
          <div
            key={key}
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer relative transform transition duration-300 hover:scale-105 hover:shadow-lg"
          >
            <div onClick={() => onSelect(navigateId)}>
              <VideoItem video={item} />
            </div>
            <button
              onClick={() => onRemove(key)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold shadow-md"
              aria-label="Remove playlist"
              title="Remove playlist"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
