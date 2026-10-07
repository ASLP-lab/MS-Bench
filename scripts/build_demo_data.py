#!/usr/bin/env python3
"""Derive front-end recording metadata and summary from canonical metadata.jsonl."""

from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "benchmark" / "metadata.jsonl"
SAMPLE = ROOT / "demo-data" / "sample_metadata.json"
SUMMARY = ROOT / "demo-data" / "summary.json"
AXES = "POSTN"


def load_rows() -> list[dict]:
    return [json.loads(line) for line in SOURCE.read_text(encoding="utf-8").splitlines() if line.strip()]


def derive(rows: list[dict]) -> tuple[list[dict], dict]:
    durations = [row["duration_seconds"] for row in rows]
    sample = [{
        "recording_id": row["recording_id"],
        "source_dataset": row["source_dataset"],
        "language": row["language"],
        "scenario": row["scenario"],
        "recording_device": row["recording_device"],
        "duration_seconds": row["duration_seconds"],
        "num_speakers": row["num_speakers"],
        "overlap_ratio": row["overlap_ratio"],
        "speaker_similarity_max": row["speaker_similarity_max"],
        "speaker_switch_q25": row["speaker_switch_q25"],
        "noise_difficulty": row["noise_difficulty"],
        "conditions": row["conditions"],
    } for row in rows]
    bins = [
        ("< 5 min", lambda value: value < 5 * 60),
        ("5-10 min", lambda value: 5 * 60 <= value < 10 * 60),
        ("10-20 min", lambda value: 10 * 60 <= value < 20 * 60),
        ("20-30 min", lambda value: 20 * 60 <= value < 30 * 60),
        ("30-60 min", lambda value: 30 * 60 <= value < 60 * 60),
        (">= 60 min", lambda value: value >= 60 * 60),
    ]
    summary = {
        "recordings": len(rows),
        "total_hours": round(sum(durations) / 3600, 2),
        "speaker_range": [min(row["num_speakers"] for row in rows), max(row["num_speakers"] for row in rows)],
        "primary_languages": ["Chinese", "English"],
        "additional_languages": ["Portuguese", "Japanese", "Thai", "Italian", "Spanish"],
        "language_distribution": dict(Counter(row["language"] for row in rows)),
        "scenario_distribution": dict(Counter(row["scenario"] for row in rows)),
        "duration_distribution": {name: sum(test(value) for value in durations) for name, test in bins},
        "median_duration_minutes": round(statistics.median(durations) / 60, 2),
        "minimum_duration_minutes": round(min(durations) / 60, 2),
        "maximum_duration_minutes": round(max(durations) / 60, 2),
        "condition_distribution": {
            axis: dict(sorted(Counter(row["conditions"][axis] for row in rows).items())) for axis in AXES
        },
    }
    return sample, summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="replace derived front-end JSON files")
    args = parser.parse_args()
    sample, summary = derive(load_rows())
    if args.write:
        SAMPLE.write_text(json.dumps(sample, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {SAMPLE.relative_to(ROOT)} and {SUMMARY.relative_to(ROOT)}")
    else:
        print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
