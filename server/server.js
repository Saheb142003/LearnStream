// server/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import passport from "passport";
import cors from "cors";
import session from "express-session";

import connectDB from "./src/utils/connectDB.js";
import authRoutes from "./src/routes/auth.js";
import "./src/config/passport.js"; // Passport config

import playlistRoutes from "./src/routes/playlist.js";

import videosRouter from "./src/routes/playerControl/transcript.js";

const app = express();

// ✅ Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // ⚠️ set true if using HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("🚀 LearnStream server is running...");
});

// PlAYLIST routes

app.use("/api/playlists", playlistRoutes);

// Player Contorls
app.use("/api/videos", videosRouter);

// Optional protected test route
app.get("/private", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ success: true, message: "This is a protected route" });
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
