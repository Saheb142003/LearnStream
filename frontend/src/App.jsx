// frontend/src/App.jsx
import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/header/Header";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Profile from "./pages/Profile/Profile";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home/Home";
import Feed from "./pages/Feed/Feed";
import Dashboard from "./pages/Dashboard/Dashboard";
import Playlist from "./pages/Playlist/Playlist";
import Learning from "./pages/MyLearning/Learning";
import VideoPlayer from "./pages/Playlist/VideoPlayer";
import PlaylistView from "./pages/Playlist/PlaylistView";
import Player from "./pages/VideoPlayer/Player"; // <-- new fancy player
import Contact from "./pages/Contact/Contact";

import About from "./pages/About/About";

const BASE_URL = "";

export default function App() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Handle post-login redirect
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = sessionStorage.getItem("afterAuthRedirect");
      if (redirectPath) {
        sessionStorage.removeItem("afterAuthRedirect");
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, navigate]);

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
      <ScrollToTop />
      <Header />
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
          <Route path="/video/:id" element={<VideoPlayer />} />

          {/* New Player route */}
          <Route path="/player/:id" element={<Player />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
