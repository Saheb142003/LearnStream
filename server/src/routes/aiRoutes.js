import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const cleanTranscript = (transcript) => {
  if (Array.isArray(transcript)) {
    return transcript.map((item) => item.text).join(" ");
  }
  if (typeof transcript === "string") {
    return transcript.replace(/\[.*?\]/g, "").trim();
  }
  return "";
};

// --- SUMMARIZE ENDPOINT ---
router.post("/summarize", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY_SUMMARY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY_SUMMARY is missing");
      return res
        .status(500)
        .json({ error: "Server configuration error: Missing API Key" });
    }

    const { transcript } = req.body;
    if (!transcript)
      return res.status(400).json({ error: "Transcript is required" });

    const cleanedText = cleanTranscript(transcript);
    if (!cleanedText)
      return res.status(400).json({ error: "Transcript is empty" });

    // Gemini 1.5 Flash has a huge context window (1M tokens), so we can be generous.
    // But let's keep it reasonable to avoid timeouts or excessive latency.
    const truncatedText = cleanedText.substring(0, 30000);

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using 'gemini-flash-latest' as 'gemini-1.5-flash' was not found for this key
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are an expert teacher. Your goal is to teach the content of this video transcript to a student.
    
    Instructions:
    1. **Filter Noise**: Ignore filler words, off-topic banter, and self-promotion. Focus only on the core educational content.
    2. **Direct Teaching**: Do NOT use phrases like "The speaker says" or "In this video". Teach the concepts directly as if you are the instructor.
    3. **Structure**:
       - **Key Topics**: List the main topics discussed.
       - **Core Concepts**: Explain the important ideas in simple terms.
       - **Questions Addressed**: List any specific questions or problems solved.
    4. **Format**: Use clear headings and bullet points. Keep it concise and easy to read.

    Transcript:
    ${truncatedText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    res.json({ summary });
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate summary. Please try again." });
  }
});

// --- QUIZ ENDPOINT ---
router.post("/quiz", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY_QUIZ;
    if (!apiKey) {
      console.error("GEMINI_API_KEY_QUIZ is missing");
      return res
        .status(500)
        .json({ error: "Server configuration error: Missing API Key" });
    }

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

    if (!sourceText) {
      return res
        .status(400)
        .json({ error: "Summary or Transcript is required" });
    }

    const truncatedText = sourceText.substring(0, 30000);

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use JSON mode for reliable output
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are a quiz generator. Generate 5 multiple-choice questions based on the ${sourceLabel.toLowerCase()} provided below.
    
    Difficulty Level: ${difficulty}
    
    Output Requirement:
    Return ONLY a JSON array of objects. Each object must have:
    - "question": string
    - "options": array of 4 strings
    - "correctAnswer": integer (0-3, representing the index of the correct option)

    ${sourceLabel}:
    ${truncatedText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let quiz;
    try {
      quiz = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", text);
      return res
        .status(500)
        .json({ error: "AI returned invalid JSON format." });
    }

    res.json({ quiz });
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate quiz. Please try again." });
  }
});

export default router;
