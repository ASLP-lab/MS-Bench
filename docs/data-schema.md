# Data schema

## Canonical recording metadata

`benchmark/metadata.jsonl` contains one JSON object per recording. `recording_id` is the stable key. Required fields are:

- `recording_id`, `source_dataset`, `language`, `scenario`, `recording_device`
- `duration_seconds`, `num_speakers`, `overlap_ratio`
- `speaker_similarity_max`, `speaker_switch_q25`, `noise_difficulty`
- `conditions`, containing exactly `P`, `O`, `S`, `T`, and `N`

`scripts/build_demo_data.py --write` derives `demo-data/sample_metadata.json` and `demo-data/summary.json` from this file. `scripts/validate_demo_data.py` checks all 99 unique IDs, condition tiers, paper tables, representative cases, and local assets.

## Condition tiers

| Axis | Meaning | Tiers |
|---|---|---|
| P | Valid reference speakers | P0: 2; P1: 3-4; P2: 5-8; P3: at least 9 |
| O | Recording-level overlap ratio | O0: 0; O1: (0, 0.10); O2: [0.10, 0.20); O3: [0.20, 0.40); O4: [0.40, 1.00] |
| S | Maximum pairwise cosine similarity | S0: [0, 0.32); S1: [0.32, 0.49); S2: [0.49, 0.65); S3: [0.65, 1] |
| T | 25th percentile of non-overlapping turn intervals | T0: at least 0.45 s; T1: [0.15, 0.45); T2: [0.06, 0.15); T3: [0, 0.06) |
| N | Acoustic degradation `d_N` | N0: [0, 0.27); N1: [0.27, 0.51); N2: [0.51, 0.74); N3: [0.74, 1] |

Higher T tiers contain shorter turn intervals. Higher N tiers indicate poorer acoustic quality. Tier numbers are not a universal difficulty ranking across all five axes.

## Representative examples

`demo-data/representative_examples.json` links a recording to a local audio excerpt, corrected TextGrid, full-recording condition profile, and reference segments on the excerpt clock. Excerpts are no longer than five minutes. Multiple reference segments may overlap.

Optional `focus_windows` entries may contain `start`, `end`, `label`, and `note`, but only after manual listening confirms the description.

## Prediction interface

`demo-data/case_predictions.json` reserves an empty, versioned interface for verified case predictions. A future case entry must include the recording ID, excerpt source offset, excerpt duration, system IDs, inference-unit spans, raw and display speaker IDs, mapping scope, status, segments, and sourced annotations. Unknown offsets use `null`, not zero. Invalid raw intervals remain artifacts and are never silently repaired into valid predictions.
