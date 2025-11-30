// frontend/src/App.jsx
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/header/Header";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Profile from "./pages/Profile/Profile";

import Home from "./pages/Home/Home";
import Feed from "./pages/Feed/Feed";
import Dashboard from "./pages/Dashboard/Dashboard";
import Playlist from "./pages/Playlist/Playlist";
import Learning from "./pages/MyLearning/Learning";
import VideoPlayer from "./pages/Playlist/VideoPlayer";
import Player from "./pages/VideoPlayer/Player"; // <-- new fancy player
import Contact from "./pages/Contact/Contact";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function App() {
  // Global App Tracking: Track app open time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${BASE_URL}/api/user/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appOpenTime: 60 }),
        credentials: "include",
      }).catch(() => {}); // Fail silently if not logged in
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/video/:id" element={<VideoPlayer />} />

          {/* New Player route */}
          <Route path="/player/:id" element={<Player />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
