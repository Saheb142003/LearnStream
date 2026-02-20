export default function FilterBar({
  searchQuery,
  setSearchQuery,
  activeFilter = "all",
  setActiveFilter,
  setDebouncedSearch,
}) {
  const chips = [
    { id: "all", label: "All" },
    { id: "playlist", label: "Playlists" },
    { id: "video", label: "Videos" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full items-center justify-between">
      {/* Filter Chips */}
      {setActiveFilter && (
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 justify-start">
          {chips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === chip.id
                  ? "bg-gray-700 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative w-full sm:w-auto shrink-0 sm:ml-auto">
        <input
          type="text"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !!setDebouncedSearch) {
              setDebouncedSearch(searchQuery);
            }
          }}
          className="w-full sm:w-64 px-4 py-2 pl-10 border border-gray-200 bg-gray-50/50 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
        />
        <svg
          className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
    </div>
  );
}
