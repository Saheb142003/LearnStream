import { NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  `hover:text-blue-600 transition ${
    isActive ? "text-blue-600 font-semibold" : "text-gray-700"
  }`;

export default function Navbar() {
  return (
    <nav
      className="flex justify-between items-center px-6 py-3 bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200
  shadow-sm"
    >
      <div className="flex gap-6 font-medium">
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
        {/* <NavLink to="/player" className={navLinkClass}>
          Player
        </NavLink> */}
      </div>
    </nav>
  );
}
