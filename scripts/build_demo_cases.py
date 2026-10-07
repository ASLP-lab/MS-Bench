#!/usr/bin/env python3
"""Build ten local reference excerpts and traceable speaker/overlap annotations.

Requires the parent benchmark workspace, corrected TextGrids, source similarity
CSVs, and ffmpeg. Existing paper-level metadata is never recomputed or modified.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
sys.path.insert(0, str(WORKSPACE))
from pipeline.tools.parser_textgrid import merge_intervals, parse_textgrid

NEW_CASES = [
    ("many-speakers", "BenchFilms_ZH::part005_ad51a3ea", "Nine-speaker dialogue",
     "A nine-speaker film excerpt with rapid turn changes and high acoustic quality.",
     "many-speakers-film.mp3"),
    ("heavy-overlap", "alimeeting_far::R8005_M8009", "High-overlap meeting",
     "A four-speaker far-field meeting with a recording-level overlap ratio of 63.6% and poor acoustic quality.",
     "heavy-overlap-alimeeting.mp3"),
    ("livestream", "SmoothConv_DuplexConv::1767604747_yZ95W3sEa9_seg91_92_93_active",
     "Live-streaming discussion", "A two-speaker live-streaming interaction with no overlap and low speaker similarity.",
     "livestream-discussion.mp3"),
]


def rounded(value: float) -> float:
    return round(value, 6)


def overlap_regions(timeline: list[dict]) -> list[dict]:
    """Sweep merged per-speaker intervals; one track never counts twice."""
    events = defaultdict(list)
    for speaker, intervals in merge_intervals(timeline).items():
        for start, end in intervals:
            if end > start:
                events[start].append((speaker, 1))
                events[end].append((speaker, -1))
    active = set()
    previous = None
    regions = []
    for timestamp, changes in sorted(events.items()):
        if previous is not None and timestamp > previous and len(active) >= 2:
            speakers = sorted(active)
            if regions and regions[-1]["end"] == previous and regions[-1]["speakers"] == speakers:
                regions[-1]["end"] = timestamp
            else:
                regions.append({"start": previous, "end": timestamp, "speakers": speakers})
        for speaker, direction in changes:
            if direction < 0:
                active.discard(speaker)
        for speaker, direction in changes:
            if direction > 0:
                active.add(speaker)
        previous = timestamp
    return regions


def union_duration(intervals: list[tuple[float, float]]) -> float:
    end = -math.inf
    duration = 0.0
    for start, stop in sorted(intervals):
        duration += max(0.0, stop - max(start, end))
        end = max(end, stop)
    return duration


def intersect_duration(first: list, second: list) -> float:
    total = 0.0
    i = j = 0
    while i < len(first) and j < len(second):
        start_a, end_a = first[i]
        start_b, end_b = second[j]
        total += max(0.0, min(end_a, end_b) - max(start_a, start_b))
        if end_a <= end_b:
            i += 1
        else:
            j += 1
    return total


def similarity_annotations(recording_id: str, corrected: list[dict]) -> dict:
    dataset, key = recording_id.split("::", 1)
    directory = WORKSPACE / "OpenSource-TestSets" / dataset / "speaker_similarity" / key
    source_metadata = json.loads((directory / "metadata.json").read_text())
    source_grid = Path(source_metadata["textgrid"])
    if not source_grid.exists():
        source_grid = WORKSPACE / "OpenSource-TestSets" / dataset / "prepared" / "textgrid" / f"{key}.TextGrid"
    _, _, original = parse_textgrid(source_grid)
    original_tracks = merge_intervals(original)
    corrected_tracks = merge_intervals(corrected)
    mapping = {}
    for source, intervals in original_tracks.items():
        scores = sorted(((intersect_duration(intervals, track), speaker)
                         for speaker, track in corrected_tracks.items()), reverse=True)
        duration = sum(end - start for start, end in intervals)
        confidence = scores[0][0] / duration if duration and scores else 0.0
        # A large majority must agree, and the second choice must be clearly lower.
        verified = confidence >= 0.8 and (len(scores) < 2 or scores[0][0] > 1.5 * scores[1][0])
        mapping[source] = {"reference": scores[0][1] if verified else None,
                           "interval_agreement": rounded(confidence)}

    pairs_path = directory / "speaker_similarity_pairs.csv"
    if pairs_path.exists():
        with pairs_path.open(newline="", encoding="utf-8-sig") as handle:
            pairs = list(csv.DictReader(handle))
    else:
        matrix_path = directory / "speaker_similarity.csv"
        with matrix_path.open(newline="", encoding="utf-8-sig") as handle:
            matrix = list(csv.reader(handle))
        pairs = [{"speaker_1": row[0], "speaker_2": matrix[0][j], "cosine_similarity": row[j]}
                 for i, row in enumerate(matrix[1:], 1) for j in range(i + 1, len(row))]
        pairs_path = matrix_path
    pairs.sort(key=lambda row: float(row["cosine_similarity"]), reverse=True)
    maximum = pairs[0]
    originals = [maximum["speaker_1"], maximum["speaker_2"]]
    references = [mapping.get(speaker, {}).get("reference") for speaker in originals]
    status = "unmapped" if None in references else ("merged" if references[0] == references[1] else "distinct")
    result = {
        "maximum": {"source_speakers": originals, "reference_speakers": references,
                    "cosine_similarity": float(maximum["cosine_similarity"]), "mapping_status": status},
        "distinct_reference_pair": None,
        "source": str(pairs_path.relative_to(WORKSPACE)),
        "scope": "full_recording_source_embeddings",
        "mapping_method": "dominant_interval_alignment_with_corrected_textgrid",
        "speaker_mapping": mapping,
    }
    for row in pairs:
        sources = [row["speaker_1"], row["speaker_2"]]
        references = [mapping.get(speaker, {}).get("reference") for speaker in sources]
        if None not in references and references[0] != references[1]:
            result["distinct_reference_pair"] = {
                "source_speakers": sources, "speakers": references,
                "cosine_similarity": float(row["cosine_similarity"]),
            }
            break
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--encode-audio", action="store_true", help="Encode the three new MP3 excerpts")
    args = parser.parse_args()
    metadata = {row["recording_id"]: row for row in
                map(json.loads, (ROOT / "benchmark/metadata.jsonl").read_text().splitlines())}
    destination = ROOT / "demo-data/representative_examples.json"
    examples = [example for example in json.loads(destination.read_text()) if example["slug"] != "japanese"]
    by_slug = {example["slug"]: example for example in examples}
    by_slug["education"]["title"] = "Tutoring conversation"
    for slug, recording_id, title, description, audio_name in NEW_CASES:
        if slug not in by_slug:
            row = metadata[recording_id]
            example = {"slug": slug, "recording_id": recording_id, "title": title,
                       "description": description, "audio": f"assets/audio/{audio_name}",
                       **{key: row[key] for key in ("language", "scenario", "recording_device", "conditions")},
                       "stats": {key: row[key] for key in ("num_speakers", "overlap_ratio", "speaker_similarity_max",
                                                          "speaker_switch_q25", "noise_difficulty")}}
            examples.append(example)
            by_slug[slug] = example
    for example in examples:
        dataset, key = example["recording_id"].split("::", 1)
        grid = WORKSPACE / "challenge100_v2_textgrids" / f"{dataset}__{key}.TextGrid"
        _, _, corrected = parse_textgrid(grid)
        audio = grid.with_suffix(".wav")
        is_new = example["slug"] in {item[0] for item in NEW_CASES}
        if is_new:
            probe = json.loads(subprocess.check_output(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(audio)], text=True))
            example["clip_duration_seconds"] = rounded(min(299.9, float(probe["format"]["duration"])))
            if args.encode_audio:
                subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(audio),
                                "-t", str(example["clip_duration_seconds"]), "-map", "0:a:0", "-ac", "1",
                                "-ar", "16000", "-codec:a", "libmp3lame", "-b:a", "64k",
                                str(ROOT / example["audio"])], check=True)
            example["textgrid"] = f"assets/textgrids/{grid.name}"
            shutil.copyfile(grid, ROOT / example["textgrid"])
        duration = example["clip_duration_seconds"]
        example["clip_start_seconds"] = 0.0
        example["timeline"] = [{**segment, "start": rounded(segment["start"]),
                                "end": rounded(min(segment["end"], duration))}
                               for segment in corrected if segment["start"] < duration and segment["end"] > segment["start"]]
        example["overlap_regions"] = overlap_regions(example["timeline"])
        overlap_seconds = sum(region["end"] - region["start"] for region in example["overlap_regions"])
        speech_seconds = union_duration([(segment["start"], segment["end"]) for segment in example["timeline"]])
        example["clip_stats"] = {"speakers": len({segment["speaker"] for segment in example["timeline"]}),
                                 "overlap_seconds": rounded(overlap_seconds),
                                 "reference_speech_seconds": rounded(speech_seconds),
                                 "overlap_ratio": rounded(overlap_seconds / speech_seconds) if speech_seconds else 0.0,
                                 "peak_concurrent_speakers": max([len(region["speakers"]) for region in example["overlap_regions"]], default=1)}
        example["speaker_similarity"] = similarity_annotations(example["recording_id"], corrected)
        maximum = example["speaker_similarity"]["maximum"]["cosine_similarity"]
        if not math.isclose(maximum, example["stats"]["speaker_similarity_max"], abs_tol=1e-6):
            raise ValueError(f"{example['recording_id']}: source maximum does not match benchmark metadata")
        regions = sorted(example["overlap_regions"], key=lambda region: region["end"] - region["start"], reverse=True)[:3]
        windows = [{"label": f"Overlap ({len(region['speakers'])} speakers)", "start": region["start"], "end": region["end"]}
                   for region in sorted(regions, key=lambda region: region["start"])]
        pair = example["speaker_similarity"]["distinct_reference_pair"]
        if pair:
            for speaker in pair["speakers"]:
                segments = [segment for segment in example["timeline"] if segment["speaker"] == speaker]
                if segments:
                    segment = max(segments, key=lambda segment: segment["end"] - segment["start"])
                    windows.append({"label": f"Listen: {speaker}", "start": segment["start"], "end": segment["end"]})
        example["focus_windows"] = windows
    destination.write_text(json.dumps(examples, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(examples)} reference cases with corrected overlap regions and verified source-speaker mappings.")


if __name__ == "__main__":
    main()
