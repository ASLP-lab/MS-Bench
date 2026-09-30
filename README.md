<div align="center">

<img src="assets/mark.svg" alt="MS-Bench mark" width="72">

# MS-Bench

### A Condition-Stratified Multi-Speaker ASR Benchmark

Fine-grained evaluation across speaker interaction, voice similarity, turn-taking, and acoustic conditions.

**Chunjiang He\*** · **Zheng Zi\*** · **Bingshen Mu** · **Yurun Li** · **Jingyi Wang** · **Lei Xie†**
ASLP@NPU, Northwestern Polytechnical University

\* Equal contribution · † Corresponding author

[![Demo](https://img.shields.io/badge/Interactive_Demo-explore-EA6A47?style=flat-square)](https://aslp-lab.github.io/MS-Bench/)
[![Metadata](https://img.shields.io/badge/Benchmark_Metadata-99_recordings-193C35?style=flat-square)](benchmark/metadata.jsonl)
[![Paper](https://img.shields.io/badge/Paper-submitted-BCA66A?style=flat-square)](#citation)

</div>

MS-Bench evaluates multi-speaker ASR systems under five recording-level conditions: **speaker number (P), overlap ratio (O), speaker similarity (S), speaker turn interval (T), and acoustic quality (N)**. It complements aggregate metrics with condition-wise diagnostics that answer a more useful question: _under which conversational conditions does a system fail, and how?_

> MS-Bench standardizes evaluation, not model inference. Bring predictions from any cascade, end-to-end model, speech LLM, or commercial API; convert them to the common segment format; then score them with the same protocol.

## Benchmark overview

| Recordings | Duration | Speakers | Conditions |
|:--:|:--:|:--:|:--:|
| **99** | **32.72 h** | **2–14** | **5 dimensions** |

The benchmark is **primarily Chinese and English**, with additional Portuguese, Japanese, Thai, Italian, and Spanish samples. It spans meetings, conversations, podcasts, films and television, dinner parties, education, live streaming, in-vehicle interaction, and smart-glasses recordings.

The [interactive demo](https://aslp-lab.github.io/MS-Bench/) lets you filter the complete metadata by condition profile, inspect distribution shifts, compare system accuracy and robustness, and listen to a small set of curated excerpts. It does not preload or expose all 99 recordings.

## Condition space

Each recording receives a profile such as `P2-O3-S2-T3-N3`.

| Axis | Statistic | Tiers |
|---|---|---|
| **P · Speaker number** | Number of valid reference speakers | `P0`: 2 · `P1`: 3–4 · `P2`: 5–8 · `P3`: ≥9 |
| **O · Overlap ratio** | Concurrent-speech duration / total reference-speech duration | `O0`: 0 · `O1`: (0, 0.10) · `O2`: [0.10, 0.20) · `O3`: [0.20, 0.40) · `O4`: ≥0.40 |
| **S · Speaker similarity** | Maximum pairwise cosine similarity of speaker embeddings | `S0`: <0.32 · `S1`: [0.32, 0.49) · `S2`: [0.49, 0.65) · `S3`: ≥0.65 |
| **T · Turn interval** | 25th percentile of non-overlapping speaker-turn gaps | `T0`: >0.45 s · `T1`: (0.15, 0.45] · `T2`: (0.06, 0.15] · `T3`: ≤0.06 s |
| **N · Acoustic difficulty** | `dN = 1 − mean(percentile(DNSMOS), percentile(NISQA))` | `N0`: <0.27 · `N1`: [0.27, 0.51) · `N2`: [0.51, 0.74) · `N3`: ≥0.74 |

Tier labels describe operating ranges rather than an assumed universal ordering of model difficulty. Analyses control relevant confounds instead of interpreting pooled trends causally.

## Data contract

### Reference metadata

The public [metadata file](benchmark/metadata.jsonl) contains one JSON object per recording. Internal storage paths and full reference content are intentionally excluded from this web-facing artifact.

```json
{
  "recording_id": "aishell4::M_R003S01C01",
  "source_dataset": "aishell4",
  "language": "Chinese",
  "scenario": "meeting",
  "recording_device": "8-channel circular microphone array",
  "duration_seconds": 2282.21,
  "conditions": {"P": "P2", "O": "O1", "S": "S2", "T": "T3", "N": "N3"}
}
```

### System output

MS-Bench does not prescribe an inference stack. Convert model predictions into speaker-attributed segments:

```json
{
  "recording_id": "aishell4::M_R003S01C01",
  "segments": [
    {"speaker": "spk0", "start": 4.08, "end": 6.65, "text": "..."},
    {"speaker": "spk1", "start": 14.50, "end": 22.06, "text": "..."}
  ]
}
```

Required properties:

- timestamps are in seconds and satisfy `0 ≤ start < end`;
- speaker identifiers are stable within one recording;
- text is the system prediction, before reference-dependent correction;
- one prediction object is provided per recording.

## Evaluation protocol

The release toolkit validates the submission schema, normalizes text by language, computes the metrics below, and summarizes overall and condition-wise results.

| Metric | What it measures |
|---|---|
| **DER** | Speaker activity and identity on the timeline, with a 0.5 s collar |
| **cpWER** | Speaker-attributed word error after the best global speaker permutation |
| **tcpWER** | Time-constrained speaker–transcript matching, with a 5 s collar |
| **WER** | Speaker-agnostic transcript content |
| **Excluded / soft degradation** | Structurally unscorable outputs / parseable but degenerate outputs |

The intended workflow is:

```text
your model → MS-Bench segment JSONL → schema validation → unified scoring → condition report
```

The inference adapter and scoring package will be published with the benchmark release. The repository will expose the following interface rather than attempting to run arbitrary third-party models:

```bash
python evaluation/validate_output.py outputs/my_system.jsonl
python evaluation/score.py \
  --reference benchmark/reference \
  --hypothesis outputs/my_system.jsonl \
  --output results/my_system
```

## What MS-Bench reveals

- **Overlap damages both words and attribution.** High overlap increases lexical error by 27.2–38.6 percentage points and attribution error by 4.2–19.1 points across the seven systems in the condition analysis.
- **Similar voices are exchanged even without overlap.** Pairwise similarity correlates with directional speaker confusion for every evaluated system (`ρ = 0.248–0.323`, `p < 0.05`).
- **Poor acoustics primarily affect recognition.** Acoustic difficulty correlates with lexical error in all systems, while attribution effects are weak and inconsistent.
- **Speaker transitions mainly affect “who.”** Attribution error rises by 1.51–4.17 points near non-overlapping turn boundaries.
- **Speaker-number effects require controls.** The reported association is conditioned on dataset identity and overlap; the raw pooled `P0 → P3` trend is not treated as causal.

Explore the per-system plots and methodology notes in the [diagnostics section](https://aslp-lab.github.io/MS-Bench/#diagnostics).

## Repository layout

```text
MS-Bench/
├── README.md
├── benchmark/
│   └── metadata.jsonl            # public recording-level metadata
├── demo-data/
│   ├── summary.json
│   ├── sample_metadata.json
│   ├── leaderboard.json
│   ├── condition_results.json
│   └── representative_examples.json
├── assets/
│   ├── audio/                    # curated demo excerpts only
│   ├── app.js
│   ├── style.css
│   └── mark.svg
├── index.html                    # GitHub Pages entry
└── demo.html                     # interactive single-page demo
```

Preview the site locally through HTTP so that the JSON data files can load:

```bash
python -m http.server 8000 --directory MS-Bench
# open http://localhost:8000/
```

## Release status

The website, public metadata schema, curated examples, reported aggregate results, and condition diagnostics are included in this repository. Full reference annotations, source-specific access instructions, adapter examples, and the unified scoring toolkit will be linked at benchmark release. Source-corpus licenses and redistribution terms continue to apply.

## Citation

```bibtex
@misc{he2026msbench,
  title  = {{MS-Bench}: A Condition-Stratified Benchmark for Multi-Speaker {ASR} Evaluation},
  author = {He, Chunjiang and Zi, Zheng and Mu, Bingshen and Li, Yurun and Wang, Jingyi and Xie, Lei},
  year   = {2026},
  note   = {Submitted manuscript}
}
```

## Contact

Please open a GitHub issue for questions about benchmark access, output conversion, or the evaluation protocol.
