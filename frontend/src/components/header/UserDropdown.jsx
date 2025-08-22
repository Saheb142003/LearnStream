// frontend/src/components/Header/UserDropdown.jsx
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

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
  let default_dp = "https://www.gravatar.com/avatar/";

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="focus:outline-none"
      >
        <img
          src={user?.picture || default_dp}
          alt={default_dp}
          className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-500 transition cursor-pointer"
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-lg border py-2 z-50">
          {!isAuthenticated && (
            <button
              onClick={onSignIn}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
            >
              🔑 Sign in / Sign up
            </button>
          )}
          {isAuthenticated && (
            <>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
              >
                👤 Profile
              </Link>
              <button
                onClick={onSignOut}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
              >
                🚪 Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
