// server/src/utils/contentFilter.js

/**
 * Educational Content Moderation Filter
 * Inspects YouTube video & playlist metadata (title, description, tags, category, duration)
 * to detect and reject full movies, cinema rips, trailers, web series, and non-educational entertainment.
 */

// Explicit Movie & Film Rip patterns
const MOVIE_PATTERNS = [
  { pattern: /\bfull\s+(?:hd\s+)?movie\b/i, label: "Full Movie" },
  { pattern: /\b(?:hindi|tamil|telugu|kannada|malayalam|punjabi|bengali|south)\s+dubbed\s+(?:full\s+)?movie\b/i, label: "Dubbed Movie" },
  { pattern: /\b(?:hollywood|bollywood|tollywood|kollywood)\s+(?:full\s+)?movie\b/i, label: "Feature Film" },
  { pattern: /\b(?:box\s*office\s*(?:hit|collection|movie)|blockbuster\s*movie)\b/i, label: "Blockbuster Movie" },
  { pattern: /\b(?:theatrical\s*release|cinema\s*hd|full\s*cinema)\b/i, label: "Cinema Release" },
];

// Piracy & Torrent Cam/Web Rip patterns
const RIP_PATTERNS = [
  { pattern: /\b(?:camrip|hdcam|hdrip|dvdrip|webrip|bdrip|bluray\s*(?:720p|1080p|4k))\b/i, label: "Media Rip / Piracy" },
  { pattern: /\b(?:1080p|720p|4k)\s*(?:hdrip|webrip|camrip|dvdrip)\b/i, label: "Video Rip" },
  { pattern: /\b(?:watch\s*full\s*movie\s*online|download\s*full\s*movie)\b/i, label: "Movie Download/Streaming" },
];

// Trailers, Teasers & Promo Clips
const TRAILER_PATTERNS = [
  { pattern: /\b(?:official\s*trailer|theatrical\s*trailer|main\s*trailer|official\s*teaser|teaser\s*trailer)\b/i, label: "Movie Trailer / Teaser" },
  { pattern: /\b(?:motion\s*poster|first\s*look\s*teaser|promotional\s*trailer)\b/i, label: "Movie Promo" },
];

// Entertainment Dramas, Soap Operas & Web Series
const SERIES_PATTERNS = [
  { pattern: /\b(?:web\s*series\s*ep(?:isode)?\s*\d+|kdrama\s*ep(?:isode)?\s*\d+|k-drama\s*ep(?:isode)?\s*\d+)\b/i, label: "Drama / Web Series Episode" },
  { pattern: /\b(?:drama\s*serial\s*episode\s*\d+|soap\s*opera\s*ep(?:isode)?\s*\d+)\b/i, label: "Entertainment Serial" },
];

// Film Credits indicators (when present in description without educational keywords)
const FILM_CREDIT_PATTERNS = [
  /\b(?:starring|star\s*cast|cast\s*&\s*crew)\s*:/i,
  /\b(?:directed\s*by|director)\s*:/i,
  /\b(?:produced\s*by|producer)\s*:/i,
  /\b(?:music\s*director|banner)\s*:/i,
];

// Positive Educational / Learning Indicators (Whitelisted terms)
const EDUCATIONAL_PATTERNS = [
  /\b(?:tutorial|course|lecture|crash\s*course|how\s*to|learn|guide|basics|fundamentals)\b/i,
  /\b(?:programming|coding|algorithm|data\s*structures|web\s*dev|machine\s*learning|artificial\s*intelligence|python|javascript|react|node|c\+\+|java|sql)\b/i,
  /\b(?:math|mathematics|physics|chemistry|biology|science|history|economics|calculus|algebra|geometry)\b/i,
  /\b(?:university|college|school|academic|syllabus|lesson\s*\d+|chapter\s*\d+|class\s*\d+|exam|jee|neet|gate|upsc|sat|ielts|toefl)\b/i,
  /\b(?:explanation|walkthrough|documentation|masterclass|study\s*with\s*me|training|bootcamp)\b/i,
];

/**
 * Validates whether a video or playlist is suitable educational content.
 * @param {Object} metadata
 * @param {string} metadata.title
 * @param {string} [metadata.description]
 * @param {string[]} [metadata.tags]
 * @param {string} [metadata.categoryId] - YouTube category ID (1 = Film, 24 = Entertainment, 27 = Education, 28 = Science & Tech)
 * @param {number} [metadata.durationSeconds]
 * @returns {{ isAllowed: boolean, reason?: string, flag?: string }}
 */
export function validateEducationalContent({
  title = "",
  description = "",
  tags = [],
  categoryId = "",
  durationSeconds = 0,
}) {
  const cleanTitle = (title || "").trim();
  const cleanDesc = (description || "").trim();
  const combinedText = `${cleanTitle}\n${cleanDesc}`;
  const tagString = Array.isArray(tags) ? tags.join(" ") : "";

  // 1. Check for explicit full movie patterns
  for (const item of MOVIE_PATTERNS) {
    if (item.pattern.test(cleanTitle) || item.pattern.test(cleanDesc)) {
      return {
        isAllowed: false,
        flag: item.label,
        reason: `This video was flagged as a feature film or movie (${item.label}). LearnStream is dedicated strictly to educational courses, tutorials, and study materials.`,
      };
    }
  }

  // 2. Check for piracy / rip patterns
  for (const item of RIP_PATTERNS) {
    if (item.pattern.test(cleanTitle) || item.pattern.test(cleanDesc) || item.pattern.test(tagString)) {
      return {
        isAllowed: false,
        flag: item.label,
        reason: `This link was flagged as unauthorized or entertainment media rip (${item.label}). LearnStream only supports authentic educational materials.`,
      };
    }
  }

  // 3. Check for movie trailers & teasers
  for (const item of TRAILER_PATTERNS) {
    if (item.pattern.test(cleanTitle)) {
      return {
        isAllowed: false,
        flag: item.label,
        reason: `This video is a movie trailer or promotional teaser (${item.label}). Please submit an educational video, tutorial, or course instead.`,
      };
    }
  }

  // 4. Check for drama / web series episodes
  for (const item of SERIES_PATTERNS) {
    if (item.pattern.test(cleanTitle)) {
      return {
        isAllowed: false,
        flag: item.label,
        reason: `This video appears to be an entertainment drama or web series (${item.label}). LearnStream is designed for educational and learning resources.`,
      };
    }
  }

  // 5. Check for film credits and category checks if NO educational terms exist
  const hasEducationalSignifiers = EDUCATIONAL_PATTERNS.some((p) =>
    p.test(cleanTitle) || p.test(cleanDesc)
  );

  if (!hasEducationalSignifiers) {
    // Count how many film credit patterns match
    const filmCreditMatches = FILM_CREDIT_PATTERNS.filter((p) => p.test(cleanDesc)).length;

    // If description has 2+ film credits (e.g. Starring, Directed by, Producer) and category is Film/Entertainment (1 or 24)
    if (filmCreditMatches >= 2 || (filmCreditMatches >= 1 && (categoryId === "1" || categoryId === "24"))) {
      return {
        isAllowed: false,
        flag: "Cinematic Content",
        reason: "This video appears to be a cinematic or entertainment production with movie credits and cast listings. Only study and learning materials are permitted.",
      };
    }
  }

  return { isAllowed: true };
}
