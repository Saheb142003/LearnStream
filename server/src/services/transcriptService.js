// server/src/services/transcriptService.js
import { chromium } from "playwright";

// Simple memory cache
const CACHE_LIMIT = 100;
const CACHE = new Map();

function getFromCache(key) {
  return CACHE.get(key);
}

function setInCache(key, value) {
  if (CACHE.size >= CACHE_LIMIT) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, value);
}

const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--single-process",
  "--disable-gpu",
];

let browser; // Reuse globally for performance

async function initBrowser() {
  if (browser) return browser;
  browser = await chromium.launch({
    headless: true,
    args: BROWSER_ARGS,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // For deployment platforms
  });
  return browser;
}

function parseTranscriptData(captionData) {
  try {
    // Try JSON first (fmt=json3)
    const json = JSON.parse(captionData);
    if (json && json.events) {
      return json.events
        .map((event) => {
          if (event.segs) {
            return event.segs.map((seg) => seg.utf8).join("");
          }
          return "";
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }
  } catch {
    // Not JSON, try XML parsing
    const regex = /<(?:text|p)[^>]*>(.*?)<\/(?:text|p)>/g;
    let match;
    const texts = [];

    while ((match = regex.exec(captionData)) !== null) {
      texts.push(match[1]);
    }

    if (texts.length > 0) {
      return texts
        .join(" ")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  throw new Error("Could not parse transcript data");
}

export async function fetchTranscriptText(videoId, lang = "en") {
  const key = `${videoId}:${lang}`;
  const cached = getFromCache(key);
  if (cached) return cached;

  const browserInstance = await initBrowser();
  const context = await browserInstance.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const page = await context.newPage();

  try {
    // Stealth fingerprints to avoid detection
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      window.chrome = { runtime: {} };
    });

    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    // Wait for player to load
    await page.waitForTimeout(2000);

    // Extract caption URL in browser context
    const result = await page.evaluate(
      ({ lang }) => {
        const match = document.documentElement.innerHTML.match(
          /ytInitialPlayerResponse\s*=\s*({.+?});/,
        );
        if (!match) throw new Error("No player response found");

        const playerResponse = JSON.parse(match[1]);
        const captions =
          playerResponse?.captions?.playerCaptionsTracklistRenderer
            ?.captionTracks;
        if (!captions?.length) throw new Error("No captions available");

        // Smart language selection
        let track =
          captions.find((c) => c.languageCode === lang) ||
          captions.find((c) => c.languageCode === "en") ||
          captions[0];

        return {
          baseUrl: track.baseUrl,
          lang: track.languageCode,
        };
      },
      { lang },
    );

    console.log(`Found ${result.lang} transcript for ${videoId}`);

    // Try JSON3 first, then XML if that fails
    let captionData = null;

    try {
      const json3Url =
        result.baseUrl +
        (result.baseUrl.includes("?") ? "&" : "?") +
        "fmt=json3";
      captionData = await page.evaluate(async (url) => {
        const res = await fetch(url);
        if (!res.ok) return null;
        const text = await res.text();
        return text.length > 0 ? text : null;
      }, json3Url);
    } catch (e) {
      console.log("JSON3 fetch failed, trying XML...");
    }

    if (!captionData || captionData.length === 0) {
      // Try XML format
      captionData = await page.evaluate(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text;
      }, result.baseUrl);
    }

    if (!captionData || captionData.length === 0) {
      throw new Error("Empty transcript response from both JSON3 and XML");
    }

    console.log(`Received ${captionData.length} bytes of caption data`);

    const text = parseTranscriptData(captionData);
    setInCache(key, text);
    console.log(
      `✅ Successfully fetched ${text.length} chars of ${result.lang} transcript`,
    );
    return text;
  } catch (e) {
    console.error(`Transcript error for ${videoId}:`, e.message);
    throw new Error(`Transcript unavailable: ${e.message}`);
  } finally {
    await page.close();
    await context.close();
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
