import sys
import json
import os
import tempfile

# Force UTF-8 output so Node.js can always read it correctly
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)


def get_video_id(input_str):
    """Extract video ID from URL or return as-is if already an ID."""
    if "youtube.com" in input_str or "youtu.be" in input_str:
        if "v=" in input_str:
            return input_str.split("v=")[1].split("&")[0]
        else:
            return input_str.split("/")[-1].split("?")[0]
    return input_str


def load_cookies_from_file(path):
    """
    Parse a Netscape cookies.txt file and return a dict of {name: value}
    for cookies scoped to .youtube.com.
    """
    cookies = {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t")
                if len(parts) == 7:
                    domain, _, path_, secure, expires, name, value = parts
                    if "youtube" in domain:
                        cookies[name] = value
    except Exception:
        pass
    return cookies


def build_api():
    """
    Build a YouTubeTranscriptApi instance using v1.2.4 API.

    Cookie resolution order (bypasses YouTube's cloud-IP block on Render/AWS/GCP):
      1. YOUTUBE_COOKIES_FILE — path to a Netscape cookies.txt file (local dev)
      2. YOUTUBE_COOKIES_TXT  — raw cookies.txt content as env var (Render)

    Proxy (alternative bypass):
      - TRANSCRIPT_PROXY — e.g. "http://user:pass@host:port"

    How to get cookies:
      1. Install "Get cookies.txt LOCALLY" Chrome extension
      2. Go to youtube.com while logged in
      3. Export → save as YOUTUBE_COOKIES_FILE or paste as YOUTUBE_COOKIES_TXT
    """
    import requests

    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    })

    # 1. Load cookies from file (local dev)
    cookies_file = os.environ.get("YOUTUBE_COOKIES_FILE", "").strip()

    # 2. If not found via env, look for sibling cookies.txt
    if not cookies_file:
        sibling = os.path.join(os.path.dirname(__file__), "cookies.txt")
        if os.path.isfile(sibling):
            cookies_file = sibling

    if cookies_file and os.path.isfile(cookies_file):
        cookies = load_cookies_from_file(cookies_file)
        session.cookies.update(cookies)

    # 3. Or load from raw env var content (Render/cloud)
    elif os.environ.get("YOUTUBE_COOKIES_TXT", "").strip():
        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", delete=False, encoding="utf-8"
        )
        tmp.write(os.environ["YOUTUBE_COOKIES_TXT"])
        tmp.close()
        cookies = load_cookies_from_file(tmp.name)
        session.cookies.update(cookies)

    # 4. Optional proxy config
    proxy_url = os.environ.get("TRANSCRIPT_PROXY", "").strip()
    if proxy_url:
        session.proxies = {"http": proxy_url, "https": proxy_url}

    return YouTubeTranscriptApi(http_client=session)


def fetch_transcript(video_id, languages=None):
    """
    Fetch transcript using youtube_transcript_api v1.x
    Returns list of {text, start, duration} dicts.
    """
    if languages is None:
        languages = ["en", "en-US", "en-GB", "en-IN"]

    api = build_api()
    transcript_list = api.list(video_id)

    transcript = None

    # 1. Manually created transcripts first
    for lang in languages:
        try:
            transcript = transcript_list.find_manually_created_transcript([lang])
            break
        except NoTranscriptFound:
            continue

    # 2. Auto-generated fallback
    if transcript is None:
        for lang in languages:
            try:
                transcript = transcript_list.find_generated_transcript([lang])
                break
            except NoTranscriptFound:
                continue

    # 3. Any available transcript
    if transcript is None:
        all_transcripts = list(transcript_list)
        if all_transcripts:
            transcript = all_transcripts[0]

    if transcript is None:
        raise NoTranscriptFound(video_id, languages, transcript_list)

    fetched = transcript.fetch()
    return [{"text": s.text, "start": s.start, "duration": s.duration} for s in fetched]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing video URL or ID"}))
        sys.exit(1)

    video_id = get_video_id(sys.argv[1])

    langs = ["en", "en-US", "en-GB", "en-IN"]
    if len(sys.argv) > 2:
        langs = [l.strip() for l in sys.argv[2].split(",") if l.strip()]

    try:
        segments = fetch_transcript(video_id, langs)
        print(json.dumps(segments, ensure_ascii=False))
    except TranscriptsDisabled:
        print(json.dumps({"error": "Transcripts are disabled for this video."}))
    except NoTranscriptFound:
        print(json.dumps({"error": "No transcript found for the requested language(s)."}))
    except VideoUnavailable:
        print(json.dumps({"error": "Video is unavailable."}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
