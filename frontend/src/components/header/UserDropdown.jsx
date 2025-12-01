// frontend/src/components/Header/UserDropdown.jsx
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogOut, User, LogIn } from "lucide-react";

export default function UserDropdown({
  isAuthenticated,
  user,
  onSignIn,
  onSignOut,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let default_dp = "https://www.gravatar.com/avatar/?d=mp";

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="focus:outline-none flex items-center gap-2 group"
      >
        <img
          src={user?.picture || default_dp}
          alt="Profile"
          className="w-9 h-9 rounded-full border-2 border-transparent group-hover:border-indigo-200 transition-all object-cover"
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all">
          {!isAuthenticated ? (
            <button
              onClick={() => {
                onSignIn();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-gray-700 flex items-center gap-3 transition-colors text-sm font-medium"
            >
              <LogIn size={16} className="text-indigo-600" />
              Sign in / Sign up
            </button>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 flex items-center gap-3 transition-colors text-sm"
              >
                <User size={16} className="text-gray-500" />
                Profile
              </Link>

              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-3 transition-colors text-sm mt-1"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
