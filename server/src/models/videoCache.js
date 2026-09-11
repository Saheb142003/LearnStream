import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // Index (0-3)
  createdAt: { type: Date, default: Date.now }
});

const videoCacheSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    transcript: { type: String, default: "" },
    summary: { type: String, default: "" },
    quizPool: [quizQuestionSchema]
  },
  { timestamps: true }
);

// TTL Index: automatically delete cached videos that haven't been updated in 30 days
videoCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("VideoCache", videoCacheSchema);
