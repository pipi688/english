#!/usr/bin/env python3
"""Offline, resumable transcription for local IELTS radio MP3 files."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import subprocess
import time
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
AUDIO_DIR = PROJECT / "data/IELTS/电台节目"
TRANSCRIPT_DIR = PROJECT / "data/IELTS/transcripts"
MODEL = PROJECT / "data/IELTS/.models/ggml-small.en-q5_1.bin"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--reverse", action="store_true")
    args = parser.parse_args()

    if not MODEL.is_file():
        raise SystemExit(f"Missing model: {MODEL}")

    TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(AUDIO_DIR.glob("*.mp3"))
    if args.reverse:
        files.reverse()
    if args.limit:
        files = files[: args.limit]

    started = time.monotonic()
    completed = skipped = failed = 0
    pending: list[Path] = []
    for position, audio in enumerate(files, 1):
        output_json = (TRANSCRIPT_DIR / audio.stem).with_suffix(".json")
        if output_json.is_file() and not args.force:
            skipped += 1
            print(f"[{position}/{len(files)}] skip {audio.name}", flush=True)
            continue
        pending.append(audio)

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {executor.submit(transcribe, audio): audio for audio in pending}
        for position, future in enumerate(as_completed(futures), skipped + 1):
            audio = futures[future]
            if future.result():
                completed += 1
                print(f"[{position}/{len(files)}] ready {audio.name}", flush=True)
            else:
                failed += 1
                print(f"[{position}/{len(files)}] FAILED {audio.name}", flush=True)
            write_index(files, completed, skipped, failed, started)

    write_index(files, completed, skipped, failed, started)
    print(f"done completed={completed} skipped={skipped} failed={failed}", flush=True)
    return 1 if failed else 0


def transcribe(audio: Path) -> bool:
    output_base = TRANSCRIPT_DIR / audio.stem
    result = subprocess.run(
        [
            "whisper-cli",
            "-m", str(MODEL),
            "-l", "en",
            "-t", "4",
            "-oj",
            "-np",
            "-of", str(output_base),
            str(audio),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return result.returncode == 0 and output_base.with_suffix(".json").is_file()


def write_index(files: list[Path], completed: int, skipped: int, failed: int, started: float) -> None:
    expected_stems = {path.stem for path in files}
    ready = sorted(path.stem for path in TRANSCRIPT_DIR.glob("*.json") if path.stem in expected_stems)
    payload = {
        "version": 1,
        "engine": "whisper.cpp small.en-q5_1",
        "reviewStatus": "ai_transcript_needs_review",
        "expected": len(files),
        "ready": len(ready),
        "completedThisRun": completed,
        "skipped": skipped,
        "failed": failed,
        "elapsedSeconds": round(time.monotonic() - started, 1),
        "files": ready,
    }
    target = TRANSCRIPT_DIR / "index.json"
    temporary = target.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(target)


if __name__ == "__main__":
    raise SystemExit(main())
