#!/usr/bin/env python3
"""Verify all 498 IELTS audio files have usable timestamped English text."""

from __future__ import annotations

import json
import re
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
AUDIO_DIR = PROJECT / "data/IELTS/电台节目"
TRANSCRIPT_DIR = PROJECT / "data/IELTS/transcripts"


def main() -> int:
    root_audio_files = sorted((PROJECT / "data/IELTS").glob("*.mp3"))
    audio_files = sorted(AUDIO_DIR.glob("*.mp3"))
    missing: list[str] = []
    invalid: list[str] = []
    ignored_segments = 0
    valid_segments = 0
    lrc_rows = 0

    for audio in root_audio_files:
        lrc = audio.with_suffix(".lrc")
        if not lrc.is_file():
            missing.append(lrc.name)
            continue
        try:
            rows = [match for line in lrc.read_text(encoding="utf-8").splitlines() if (match := re.match(r"^\[(\d+):(\d+(?:\.\d+)?)\](.*)$", line)) and match.group(3).strip()]
        except OSError:
            invalid.append(lrc.name)
            continue
        timestamps = [int(match.group(1)) * 60 + float(match.group(2)) for match in rows]
        if not rows or any(later < earlier for earlier, later in zip(timestamps, timestamps[1:])) or any(not re.search(r"[A-Za-z]", match.group(3)) for match in rows):
            invalid.append(lrc.name)
            continue
        lrc_rows += len(rows)

    for audio in audio_files:
        transcript = TRANSCRIPT_DIR / f"{audio.stem}.json"
        if not transcript.is_file():
            missing.append(audio.name)
            continue
        try:
            payload = json.loads(transcript.read_text(encoding="utf-8"))
            segments = payload.get("transcription") or []
            usable = [segment for segment in segments if valid_segment(segment)]
        except (OSError, ValueError, TypeError):
            invalid.append(transcript.name)
            continue
        if not usable:
            invalid.append(transcript.name)
            continue
        valid_segments += len(usable)
        ignored_segments += len(segments) - len(usable)

    total_audio = len(root_audio_files) + len(audio_files)
    print(f"root_audio_with_lrc={len(root_audio_files)}")
    print(f"radio_audio_with_json={len(audio_files)}")
    print(f"audio={total_audio}")
    print(f"ready={total_audio - len(missing) - len(invalid)}")
    print(f"missing={len(missing)}")
    print(f"invalid={len(invalid)}")
    print(f"valid_segments={valid_segments}")
    print(f"valid_lrc_rows={lrc_rows}")
    print(f"ignored_zero_or_invalid_segments={ignored_segments}")
    for name in missing:
        print(f"MISSING {name}")
    for name in invalid:
        print(f"INVALID {name}")
    return 1 if missing or invalid or not root_audio_files or not audio_files else 0


def valid_segment(segment: object) -> bool:
    if not isinstance(segment, dict) or not str(segment.get("text", "")).strip():
        return False
    offsets = segment.get("offsets")
    if not isinstance(offsets, dict):
        return False
    start = offsets.get("from")
    end = offsets.get("to")
    return isinstance(start, (int, float)) and isinstance(end, (int, float)) and end > start


if __name__ == "__main__":
    raise SystemExit(main())
