// frontend/src/components/Navbar.jsx
import { NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  `hover:text-blue-600 transition ${
    isActive ? "text-blue-600 font-semibold" : "text-gray-700"
  }`;

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 font-medium whitespace-nowrap mx-auto md:mx-0">
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
      </div>
    </nav>
  );
}
