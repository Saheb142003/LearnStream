import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// GET /api/user/dashboard - Get all user data for dashboard
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Initialize fields if missing
    if (!user.stats)
      user.stats = {
        totalWatchTime: 0,
        totalQuizzesSolved: 0,
        topicsCleared: [],
      };
    if (!user.dailyActivity) user.dailyActivity = [];
    if (!user.quizHistory) user.quizHistory = [];

    // Calculate Streak
    let streak = 0;
    const sortedActivity = user.dailyActivity.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    // Check if active today or yesterday to start streak
    let currentCheck = new Date();
    if (sortedActivity.length > 0) {
      const lastActive = sortedActivity[0].date;
      if (lastActive === today || lastActive === yesterday) {
        streak = 1;
        // Simple logic: iterate backwards checking for consecutive days
        for (let i = 1; i < sortedActivity.length; i++) {
          const prevDate = new Date(sortedActivity[i - 1].date);
          const currDate = new Date(sortedActivity[i].date);
          const diffTime = Math.abs(prevDate - currDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      stats: user.stats,
      dailyActivity: user.dailyActivity,
      quizHistory: user.quizHistory,
      streak,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        lastLogin: user.lastLogin,
        accountType: user.accountType,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ... (existing code) ...

// PUT /api/user/profile - Update user profile
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const { name, accountType } = req.body;
    const userId = req.user._id || req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    const updateData = { name: name.trim() };
    if (accountType) {
      updateData.accountType = accountType;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        lastLogin: user.lastLogin,
        accountType: user.accountType,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/quiz-result - Save quiz result
router.post("/quiz-result", isAuthenticated, async (req, res) => {
  try {
    const { videoId, videoTitle, score, totalQuestions, difficulty, topics } =
      req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Add to history
    user.quizHistory.push({
      date: new Date(),
      videoId,
      videoTitle,
      score,
      totalQuestions,
      difficulty,
    });

    // Update stats
    if (!user.stats) {
      user.stats = {
        totalWatchTime: 0,
        totalQuizzesSolved: 0,
        topicsCleared: [],
      };
    }
    user.stats.totalQuizzesSolved += 1;

    // Update topics
    if (topics && Array.isArray(topics)) {
      topics.forEach((topic) => {
        if (!user.stats.topicsCleared.includes(topic)) {
          user.stats.topicsCleared.push(topic);
        }
      });
    }

    await user.save();

    res.json({ success: true, quizHistory: user.quizHistory });
  } catch (error) {
    console.error("Save Quiz Result Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/track - Track user activity (watch time, app open time)
router.post("/track", isAuthenticated, async (req, res) => {
  try {
    const { videoId, watchTime, appOpenTime } = req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toISOString().split("T")[0];
    let todayActivity = user.dailyActivity.find((a) => a.date === today);

    if (!todayActivity) {
      todayActivity = {
        date: today,
        watchTime: 0,
        appOpenTime: 0,
        videosWatched: [],
        loginCount: 1,
      };
      user.dailyActivity.push(todayActivity);
      // Re-fetch reference after push? No, Mongoose handles subdoc mutation usually.
      // But safe to access the last element.
      todayActivity = user.dailyActivity[user.dailyActivity.length - 1];
    }

    // Update Watch Time
    if (watchTime && typeof watchTime === "number") {
      user.stats.totalWatchTime = (user.stats.totalWatchTime || 0) + watchTime;
      todayActivity.watchTime = (todayActivity.watchTime || 0) + watchTime;
    }

    // Update App Open Time
    if (appOpenTime && typeof appOpenTime === "number") {
      todayActivity.appOpenTime =
        (todayActivity.appOpenTime || 0) + appOpenTime;
    }

    // Track Video
    if (videoId && !todayActivity.videosWatched.includes(videoId)) {
      todayActivity.videosWatched.push(videoId);
    }

    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Tracking Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
