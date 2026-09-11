import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import VideoCache from "../models/videoCache.js";
import User from "../models/User.js";

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cleanTranscript = (transcript) => {
  if (Array.isArray(transcript)) return transcript.map((i) => i.text).join(" ");
  if (typeof transcript === "string")
    return transcript.replace(/\[.*?\]/g, "").trim();
  return "";
};

/**
 * Run the prompt through working models in order.
 * Only 503 / 429 (capacity / rate-limit) trigger a single same-model retry.
 * Any other error immediately falls through to the next model.
 */
const MODELS = ["gemini-2.5-flash"];

async function generateWithFallback(apiKey, prompt, generationConfig = {}) {
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      const isCapacity =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("429") ||
        err?.message?.toLowerCase().includes("fetch") ||
        err?.message?.toLowerCase().includes("network");

      if (isCapacity) {
        // One brief wait, then try the same model once more
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig,
          });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) return text;
        } catch {
          /* fall through to next model */
        }
      }

      console.warn(`[AI] ${modelName} failed: ${err.message?.slice(0, 150)}`);
    }
  }

  throw new Error(
    "Gemini is currently unavailable. Please try again in a moment.",
  );
}

// ─── SUMMARIZE ────────────────────────────────────────────────────────────────
router.post("/summarize", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY_SUMMARY;
    if (!apiKey)
      return res
        .status(500)
        .json({ error: "Server configuration error: Missing API Key" });

    const { videoId, transcript } = req.body;

    // Check cache first
    if (videoId) {
      const cached = await VideoCache.findOne({ videoId });
      if (cached && cached.summary) {
        return res.json({ summary: cached.summary });
      }
    }

    if (!transcript)
      return res.status(400).json({ error: "Transcript is required" });

    const cleanedText = cleanTranscript(transcript);
    if (!cleanedText)
      return res.status(400).json({ error: "Transcript is empty" });

    const truncatedText = cleanedText.substring(0, 30000);

    const prompt = `You are an expert teacher. Your goal is to teach the content of this video transcript to a student.

Instructions:
1. **Filter Noise**: Ignore filler words, off-topic banter, and self-promotion. Focus only on the core educational content.
2. **Direct Teaching**: Do NOT use phrases like "The speaker says" or "In this video". Teach the concepts directly as if you are the instructor.
3. **Structure**:
   - **Key Topics**: List the main topics discussed.
   - **Core Concepts**: Explain the important ideas in simple terms.
   - **Questions Addressed**: List any specific questions or problems solved.
4. **Format**: Use clear markdown headings (###) and bullet points (*). Keep it concise and easy to read.

Transcript:
${truncatedText}`;

    const summary = await generateWithFallback(apiKey, prompt);

    // Save in Cache
    if (videoId) {
      await VideoCache.findOneAndUpdate(
        { videoId },
        { $set: { summary } },
        { upsert: true, new: true }
      );
    }

    res.json({ summary });
  } catch (error) {
    console.error("Gemini Summary Error:", error.message);
    const is503 =
      error?.status === 503 || error?.message?.includes("unavailable");
    res.status(is503 ? 503 : 500).json({
      error: error.message || "Failed to generate summary. Please try again.",
    });
  }
});

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
router.post("/quiz", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY_QUIZ;
    if (!apiKey)
      return res
        .status(500)
        .json({ error: "Server configuration error: Missing API Key" });

    const { videoId, transcript, summary, difficulty = "medium" } = req.body;

    let user = null;
    if (req.user) {
      user = await User.findById(req.user._id || req.user.id);
    }

    if (videoId) {
      const cached = await VideoCache.findOne({ videoId });
      if (cached && cached.quizPool && cached.quizPool.length > 0) {
        if (user) {
          const solvedSet = new Set(user.solvedQuestions || []);
          const unsolved = cached.quizPool.filter((q) => !solvedSet.has(q.question));

          if (unsolved.length >= 5) {
            return res.json({ quiz: unsolved.slice(0, 5) });
          }
        } else {
          // For guest users, return the first 5 questions in the cache pool
          return res.json({ quiz: cached.quizPool.slice(0, 5) });
        }
      }
    }

    let sourceText = "";
    let sourceLabel = "";

    if (summary && typeof summary === "string" && summary.trim().length > 0) {
      sourceText = summary;
      sourceLabel = "Summary";
    } else if (transcript) {
      sourceText = cleanTranscript(transcript);
      sourceLabel = "Transcript";
    }

    if (!sourceText && videoId) {
      const cached = await VideoCache.findOne({ videoId });
      if (cached) {
        sourceText = cached.summary || cleanTranscript(cached.transcript);
        sourceLabel = cached.summary ? "Summary" : "Transcript";
      }
    }

    if (!sourceText)
      return res
        .status(400)
        .json({ error: "Summary or Transcript is required to generate quiz" });

    const truncatedText = sourceText.substring(0, 30000);

    const prompt = `You are a quiz generator. Generate 5 multiple-choice questions based on the ${sourceLabel.toLowerCase()} provided below.

Difficulty Level: ${difficulty}

Output Requirement:
Return ONLY a JSON array of objects. Each object must have:
- "question": string
- "options": array of 4 strings
- "correctAnswer": integer (0-3, representing the index of the correct option)

${sourceLabel}:
${truncatedText}`;

    const text = await generateWithFallback(apiKey, prompt, {
      responseMimeType: "application/json",
    });

    let generatedQuestions;
    try {
      generatedQuestions = JSON.parse(text);
      if (!Array.isArray(generatedQuestions)) {
        generatedQuestions = [generatedQuestions];
      }
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", text.slice(0, 200));
      return res
        .status(500)
        .json({ error: "AI returned invalid JSON format." });
    }

    // Save in Cache
    if (videoId) {
      await VideoCache.findOneAndUpdate(
        { videoId },
        { $push: { quizPool: { $each: generatedQuestions } } },
        { upsert: true, new: true }
      );
    }

    res.json({ quiz: generatedQuestions });
  } catch (error) {
    console.error("Gemini Quiz Error:", error.message);
    const is503 =
      error?.status === 503 || error?.message?.includes("unavailable");
    res.status(is503 ? 503 : 500).json({
      error: error.message || "Failed to generate quiz. Please try again.",
    });
  }
});

export default router;
