// frontend/src/components/Navbar.jsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinkClass = ({ isActive }) =>
  `hover:text-blue-600 transition ${
    isActive ? "text-blue-600 font-semibold" : "text-gray-700"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 shadow-sm">
      <div className="flex justify-between items-center px-6 py-2">
        {/* Left section: Logo + Nav links */}
        <div className="flex items-center gap-8">
          {/* Desktop Nav */}
          <div className="hidden md:flex gap-6 font-medium">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/feed" className={navLinkClass}>
              Feed
            </NavLink>
            <NavLink to="/playlist" className={navLinkClass}>
              Playlist
            </NavLink>
            <NavLink to="/learning" className={navLinkClass}>
              My Learning
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu with animation */}
      <div
        className={`md:hidden flex flex-col gap-1 px-5 pb-2 font-medium bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 transition-all duration-300 overflow-hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <NavLink to="/" className={navLinkClass} onClick={() => setOpen(false)}>
          Home
        </NavLink>
        <NavLink
          to="/feed"
          className={navLinkClass}
          onClick={() => setOpen(false)}
        >
          Feed
        </NavLink>
        <NavLink
          to="/playlist"
          className={navLinkClass}
          onClick={() => setOpen(false)}
        >
          Playlist
        </NavLink>
        <NavLink
          to="/learning"
          className={navLinkClass}
          onClick={() => setOpen(false)}
        >
          My Learning
        </NavLink>
        <NavLink
          to="/dashboard"
          className={navLinkClass}
          onClick={() => setOpen(false)}
        >
          Dashboard
        </NavLink>
      </div>
    </nav>
  );
}
