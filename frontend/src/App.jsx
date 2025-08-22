// frontend/src/App.jsx
import { Routes, Route } from "react-router-dom";
import Header from "./components/header/Header";
import Navbar from "./components/navbar/Navbar";
import Profile from "./pages/profile/Profile";

import Home from "./pages/Home/Home";
import Feed from "./pages/Feed/Feed";
import Dashboard from "./pages/Dashboard/Dashboard";
import Playlist from "./pages/Playlist/Playlist";
import Learning from "./pages/MyLearning/Learning";
import VideoPlayer from "./pages/Playlist/VideoPlayer";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Navbar />
      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/video/:id" element={<VideoPlayer />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learning" element={<Learning />} />

          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}
