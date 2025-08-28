import sys
import json
import re
import requests
import html
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, parse_qs

try:
    from youtube_transcript_api import (
        YouTubeTranscriptApi,
        TranscriptsDisabled,
        NoTranscriptFound
    )
    HAVE_YTA = True
except ImportError:
    HAVE_YTA = False


def _extract_video_id(url_or_id: str) -> str:
    s = url_or_id.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", s):
        return s
    try:
        u = urlparse(s)
        if u.netloc.endswith("youtu.be"):
            return u.path.strip("/")
        if "v" in parse_qs(u.query):
            return parse_qs(u.query)["v"][0]
        if u.path.startswith("/embed/") or u.path.startswith("/shorts/"):
            return u.path.split("/")[2]
    except Exception:
        pass
    return s


def _http_get(url, params=None, timeout=10):
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/124 Safari/537.36"
    }
    return requests.get(url, params=params, headers=headers, timeout=timeout)


def _parse_timedtext_xml(xml_text: str) -> str:
    if not xml_text.strip():
        return ""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return ""
    lines = []
    for elem in root.findall("text"):
        t = (elem.text or "").replace("\n", " ").strip()
        if t:
            lines.append(html.unescape(t))
    return " ".join(lines).strip()


def fetch_timedtext_transcript(video_id: str) -> str:
    base = "https://www.youtube.com/api/timedtext"

    # 1) Try English manual/auto
    for kind in ("", "asr"):
        for code in ("en", "en-US", "en-GB", "en-IN"):
            r = _http_get(base, params={"v": video_id, "lang": code, "kind": kind} if kind else {"v": video_id, "lang": code})
            if r.status_code == 200:
                txt = _parse_timedtext_xml(r.text)
                if txt:
                    return txt

    # 2) Force-translate to English
    for kind in ("", "asr"):
        r = _http_get(base, params={"v": video_id, "kind": kind, "tlang": "en"} if kind else {"v": video_id, "tlang": "en"})
        if r.status_code == 200:
            txt = _parse_timedtext_xml(r.text)
            if txt:
                return txt

    return ""


def fetch_plain_english_transcript(video_id: str):
    if HAVE_YTA:
        try:
            transcript = None
            try:
                transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
            except NoTranscriptFound:
                transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["en-US", "en-GB", "en-IN"])

            if transcript:
                full_text = " ".join([entry["text"] for entry in transcript])
                if full_text.strip():
                    return [full_text]
        except (TranscriptsDisabled, NoTranscriptFound):
            pass
        except Exception:
            pass

    txt = fetch_timedtext_transcript(video_id)
    if txt.strip():
        return [txt]

    return []


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video URL provided"}))
        sys.exit(1)

    vid = _extract_video_id(sys.argv[1])
    result = fetch_plain_english_transcript(vid)

    print(json.dumps(result, ensure_ascii=False))
