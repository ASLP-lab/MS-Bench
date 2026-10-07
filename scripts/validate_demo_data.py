#!/usr/bin/env python3
"""Validate demo data, paper tables, and representative assets."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from build_demo_data import ROOT, SAMPLE, SUMMARY, derive, load_rows

EXPECTED_TIERS = {
    "P": {"P0": 27, "P1": 29, "P2": 33, "P3": 10},
    "O": {"O0": 23, "O1": 22, "O2": 10, "O3": 26, "O4": 18},
    "S": {"S0": 9, "S1": 12, "S2": 31, "S3": 47},
    "T": {"T0": 10, "T1": 14, "T2": 42, "T3": 33},
    "N": {"N0": 7, "N1": 5, "N2": 25, "N3": 62},
}
EXPECTED_SYSTEMS = ["moss_pro", "moss", "qwen_omni", "vibevoice", "pyannote_qwen", "doubao", "soulx"]


def fail(message: str) -> None:
    raise AssertionError(message)


def main() -> None:
    rows = load_rows()
    ids = [row["recording_id"] for row in rows]
    if len(rows) != 99 or len(set(ids)) != 99:
        fail("Canonical metadata must contain 99 unique recording_id values")
    for row in rows:
        for field in ("source_dataset", "language", "scenario", "recording_device", "duration_seconds", "conditions"):
            if field not in row:
                fail(f"{row.get('recording_id', '<unknown>')}: missing {field}")
        if not math.isfinite(row["duration_seconds"]) or row["duration_seconds"] <= 0:
            fail(f"{row['recording_id']}: invalid duration_seconds")
        for axis, tier in row["conditions"].items():
            if tier not in EXPECTED_TIERS.get(axis, {}):
                fail(f"{row['recording_id']}: invalid {axis} tier {tier}")

    derived_sample, derived_summary = derive(rows)
    sample = json.loads(SAMPLE.read_text(encoding="utf-8"))
    summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
    if sample != derived_sample:
        fail("demo-data/sample_metadata.json is not derived from benchmark/metadata.jsonl")
    for key in ("recordings", "language_distribution", "scenario_distribution", "condition_distribution"):
        if summary[key] != derived_summary[key]:
            fail(f"demo-data/summary.json mismatch: {key}")
    if summary["condition_distribution"] != EXPECTED_TIERS:
        fail("Condition distribution does not match the paper")

    leaderboard = json.loads((ROOT / "demo-data/leaderboard.json").read_text(encoding="utf-8"))
    if [row["system_id"] for row in leaderboard] != EXPECTED_SYSTEMS:
        fail("Leaderboard must contain the seven paper systems in stable ID order")
    if any(row["system"] == "DiaScriber" for row in leaderboard):
        fail("DiaScriber must not appear in the paper main table")

    diagnostics = json.loads((ROOT / "demo-data/condition_results.json").read_text(encoding="utf-8"))
    if [row["id"] for row in diagnostics["systems"]] != EXPECTED_SYSTEMS:
        fail("Diagnostic systems do not align with leaderboard stable IDs")
    if len(diagnostics["acoustic"]["series"]) != 3:
        fail("Acoustic diagnostics must include lexical, attribution, and R_time series")

    examples = json.loads((ROOT / "demo-data/representative_examples.json").read_text(encoding="utf-8"))
    if len(examples) != 10 or len({example["recording_id"] for example in examples}) != 10:
        fail("Reference gallery must contain ten unique recordings")
    if len({example["slug"] for example in examples}) != 10:
        fail("Reference gallery slugs must be unique")
    if any(example["slug"] == "japanese" for example in examples):
        fail("Japanese phone conversation must not appear in the reference gallery")
    if not any(example["conditions"]["P"] == "P3" for example in examples):
        fail("Reference gallery must include a P3 case")
    canonical = {row["recording_id"]: row for row in rows}
    for example in examples:
        recording_id = example["recording_id"]
        if recording_id not in canonical:
            fail(f"Unknown representative recording_id: {recording_id}")
        if example["conditions"] != canonical[recording_id]["conditions"]:
            fail(f"{recording_id}: representative conditions differ from canonical metadata")
        for field in ("audio", "textgrid"):
            asset = ROOT / example[field]
            if not asset.is_file():
                fail(f"{recording_id}: missing {field} asset {example[field]}")
        if example["clip_duration_seconds"] > 300.1:
            fail(f"{recording_id}: excerpt exceeds five minutes")
        for segment in example["timeline"]:
            if segment["start"] < 0 or segment["end"] < segment["start"] or segment["end"] > example["clip_duration_seconds"] + 0.5:
                fail(f"{recording_id}: invalid timeline interval {segment}")
        clip = example["clip_stats"]
        speakers = {segment["speaker"] for segment in example["timeline"]}
        if clip["speakers"] != len(speakers):
            fail(f"{recording_id}: excerpt speaker count does not match timeline")
        regions = example["overlap_regions"]
        boundaries = sorted({time for segment in example["timeline"]
                             for time in (segment["start"], segment["end"])})
        expected_overlap = reference_speech = 0.0
        peak_speakers = 0
        for start, end in zip(boundaries, boundaries[1:]):
            midpoint = (start + end) / 2
            active = {segment["speaker"] for segment in example["timeline"]
                      if segment["start"] <= midpoint < segment["end"]}
            peak_speakers = max(peak_speakers, len(active))
            if active:
                reference_speech += end - start
            if len(active) >= 2:
                expected_overlap += end - start
        if not math.isclose(reference_speech, clip["reference_speech_seconds"], abs_tol=1e-5):
            fail(f"{recording_id}: excerpt reference speech duration is inconsistent")
        if not math.isclose(expected_overlap, clip["overlap_seconds"], abs_tol=1e-5):
            fail(f"{recording_id}: excerpt overlap annotations omit or duplicate reference overlap")
        if clip["peak_concurrent_speakers"] != peak_speakers:
            fail(f"{recording_id}: peak concurrent speakers is inconsistent")
        expected_ratio = expected_overlap / reference_speech if reference_speech else 0.0
        if not math.isclose(expected_ratio, clip["overlap_ratio"], abs_tol=1e-6):
            fail(f"{recording_id}: excerpt overlap ratio is inconsistent")
        if any(first["end"] > second["start"] for first, second in zip(regions, regions[1:])):
            fail(f"{recording_id}: overlap regions must be sorted and disjoint")
        for region in regions:
            if not (0 <= region["start"] < region["end"] <= example["clip_duration_seconds"]):
                fail(f"{recording_id}: invalid overlap region")
            midpoint = (region["start"] + region["end"]) / 2
            active = {segment["speaker"] for segment in example["timeline"]
                      if segment["start"] <= midpoint < segment["end"]}
            if len(active) < 2 or active != set(region["speakers"]):
                fail(f"{recording_id}: overlap band is inconsistent with reference speakers")
        overlap_duration = sum(region["end"] - region["start"] for region in regions)
        if not math.isclose(overlap_duration, clip["overlap_seconds"], abs_tol=1e-5):
            fail(f"{recording_id}: excerpt overlap duration does not match highlighted bands")
        maximum = example["speaker_similarity"]["maximum"]
        if not math.isclose(maximum["cosine_similarity"], canonical[recording_id]["speaker_similarity_max"], abs_tol=1e-6):
            fail(f"{recording_id}: source similarity maximum differs from benchmark metadata")
        if maximum["mapping_status"] == "merged" and len(set(maximum["reference_speakers"])) != 1:
            fail(f"{recording_id}: merged source pair must refer to the same corrected speaker")
        pair = example["speaker_similarity"]["distinct_reference_pair"]
        if pair and (len(set(pair["speakers"])) != 2 or not set(pair["speakers"]).issubset(speakers)):
            fail(f"{recording_id}: highlighted similarity pair must be two reference speakers in the excerpt")
        for window in example.get("focus_windows", []):
            if not (0 <= window["start"] < window["end"] <= example["clip_duration_seconds"]):
                fail(f"{recording_id}: invalid listening shortcut interval")

    print(f"Validated {len(rows)} recordings, {len(leaderboard)} systems, and {len(examples)} representative cases.")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, KeyError, TypeError, ValueError) as error:
        print(f"Validation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
