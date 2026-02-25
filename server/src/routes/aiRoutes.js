import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cleanTranscript = (transcript) => {
  if (Array.isArray(transcript)) return transcript.map((i) => i.text).join(" ");
  if (typeof transcript === "string")
    return transcript.replace(/\[.*?\]/g, "").trim();
  return "";
};

/**
 * Try models in order, retrying on 503 with exponential backoff.
 * Returns the generated text string.
 */
const MODEL_CASCADE = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash-8b",
];

async function generateWithFallback(apiKey, prompt, generationConfig = {}) {
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODEL_CASCADE) {
    // Each model gets up to 2 attempts (handles transient 503)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig,
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) {
          return text;
        }
      } catch (err) {
        const is503 = err?.status === 503 || err?.message?.includes("503");
        const is429 = err?.status === 429 || err?.message?.includes("429");

        if ((is503 || is429) && attempt === 1) {
          // Brief wait then retry same model
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        // Non-retriable error on this model → try next model
        console.warn(
          `[AI] ${modelName} failed (attempt ${attempt}): ${err.message?.slice(0, 120)}`,
        );
        break;
      }
    }
  }

  throw new Error(
    "All Gemini models are currently unavailable. Please try again in a moment.",
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

    const { transcript } = req.body;
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

    const { transcript, summary, difficulty = "medium" } = req.body;

    let sourceText = "";
    let sourceLabel = "";

    if (summary && typeof summary === "string" && summary.trim().length > 0) {
      sourceText = summary;
      sourceLabel = "Summary";
    } else if (transcript) {
      sourceText = cleanTranscript(transcript);
      sourceLabel = "Transcript";
    }

    if (!sourceText)
      return res
        .status(400)
        .json({ error: "Summary or Transcript is required" });

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

    let quiz;
    try {
      quiz = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", text.slice(0, 200));
      return res
        .status(500)
        .json({ error: "AI returned invalid JSON format." });
    }

    res.json({ quiz });
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
