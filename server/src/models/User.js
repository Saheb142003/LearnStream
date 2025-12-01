// server/src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      index: true,
    },
    picture: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    accountType: {
      type: String,
      enum: ["Student", "Teacher", "Developer", "Learner", "Other"],
      default: "Learner",
    },
    // Tracking Data
    stats: {
      totalWatchTime: { type: Number, default: 0 }, // in seconds
      totalQuizzesSolved: { type: Number, default: 0 },
      topicsCleared: [{ type: String }],
    },
    dailyActivity: [
      {
        date: { type: String, required: true }, // Format: YYYY-MM-DD
        watchTime: { type: Number, default: 0 }, // in seconds
        appOpenTime: { type: Number, default: 0 }, // in seconds
        videosWatched: [{ type: String }], // videoIds
        loginCount: { type: Number, default: 0 },
      },
    ],
    quizHistory: [
      {
        date: { type: Date, default: Date.now },
        videoId: String,
        videoTitle: String,
        score: Number,
        totalQuestions: Number,
        difficulty: String,
      },
    ],
    // New: Detailed progress for "Continue Watching"
    learningProgress: [
      {
        videoId: { type: String, required: true },
        title: String,
        thumbnailUrl: String,
        lastWatched: { type: Date, default: Date.now },
        playlistId: String,
      },
    ],
  },
  { timestamps: true }
);

// update last login time
userSchema.methods.updateLoginTime = async function () {
  this.lastLogin = new Date();

  // Also log daily login
  const today = new Date().toISOString().split("T")[0];
  let todayActivity = this.dailyActivity.find((a) => a.date === today);

  if (todayActivity) {
    todayActivity.loginCount += 1;
  } else {
    this.dailyActivity.push({
      date: today,
      loginCount: 1,
      watchTime: 0,
      appOpenTime: 0,
      videosWatched: [],
    });
  }

  await this.save();
};

export default mongoose.model("User", userSchema);
