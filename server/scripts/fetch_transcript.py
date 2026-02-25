import sys
import json
import os

# Force UTF-8 output so Node.js can always read it correctly
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)
from youtube_transcript_api.formatters import TextFormatter


def get_video_id(input_str):
    """Extract video ID from URL or return as-is if already an ID."""
    if "youtube.com" in input_str or "youtu.be" in input_str:
        if "v=" in input_str:
            return input_str.split("v=")[1].split("&")[0]
        else:
            return input_str.split("/")[-1].split("?")[0]
    return input_str


def fetch_transcript(video_id, languages=None):
    """
    Fetch transcript using youtube_transcript_api v1.x
    Returns: list of {text, start, duration} dicts, or raises on error
    """
    if languages is None:
        languages = ["en", "en-US", "en-GB", "en-IN"]

    api = YouTubeTranscriptApi()

    # Try to list available transcripts first for better fallback
    try:
        transcript_list = api.list(video_id)
    except (TranscriptsDisabled, VideoUnavailable) as e:
        raise

    # Try each language preference in order
    transcript = None

    # 1. Try manually created transcripts
    for lang in languages:
        try:
            transcript = transcript_list.find_manually_created_transcript([lang])
            break
        except NoTranscriptFound:
            continue

    # 2. Fallback: auto-generated transcripts
    if transcript is None:
        for lang in languages:
            try:
                transcript = transcript_list.find_generated_transcript([lang])
                break
            except NoTranscriptFound:
                continue

    # 3. Last resort: get any available transcript
    if transcript is None:
        try:
            all_transcripts = list(transcript_list)
            if all_transcripts:
                transcript = all_transcripts[0]
        except Exception:
            pass

    if transcript is None:
        raise NoTranscriptFound(video_id, languages, transcript_list)

    # Fetch the actual segments
    fetched = transcript.fetch()
    return [{"text": s.text, "start": s.start, "duration": s.duration} for s in fetched]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing video URL or ID"}))
        sys.exit(1)

    video_id = get_video_id(sys.argv[1])

    langs = ["en", "en-US", "en-GB", "en-IN"]
    if len(sys.argv) > 2:
        langs = sys.argv[2].split(",")

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
