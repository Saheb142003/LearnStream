// frontend/src/components/navbar/Navbar.jsx
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 py-3 bg-white border-b shadow-sm">
      {/* Left Nav Links */}
      <div className="flex gap-6 text-gray-700 font-medium">
        <Link to="/" className="hover:text-blue-600 transition">
          Home
        </Link>
        <Link to="/feed" className="hover:text-blue-600 transition">
          Feed
        </Link>
        <Link to="/playlist" className="hover:text-blue-600 transition">
          Playlist
        </Link>
        <Link to="/learning" className="hover:text-blue-600 transition">
          My Learning
        </Link>
        <Link to="/dashboard" className="hover:text-blue-600 transition">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
