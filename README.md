<div align="center">

<img src="assets/mark.svg" alt="MS-Bench icon" width="104">

# MS-Bench: A Condition-Stratified Multi-Speaker ASR Benchmark

[**Interactive Demo Page**](https://aslp-lab.github.io/MS-Bench/demo.html?v=20260930)

</div>

## MS-Bench

Understanding real-world conversations requires not only accurate speech recognition, but also a faithful account of **who spoke what and when**. Multi-speaker automatic speech recognition (MSASR) addresses this problem by jointly transcribing speech and attributing each segment to its corresponding speaker. Despite rapid progress in end-to-end speech large language models, MSASR remains challenging under overlapping speech, rapid speaker transitions, acoustically similar speakers, and diverse recording conditions.

Existing benchmarks typically cover only a narrow range of multi-speaker conditions or focus on a single application scenario. Aggregate scores on these benchmarks therefore make it difficult to identify where a system fails and whether its errors arise from lexical recognition, temporal prediction, or speaker attribution.

**MS-Bench** is a condition-stratified benchmark for fine-grained MSASR evaluation. It integrates recordings from multiple public and internal benchmarks and characterizes every recording along five dimensions: **speaker number, overlap ratio, speaker similarity, speaker turn interval, and acoustic quality**. These dimensions are divided into interpretable condition ranges, enabling systematic evaluation across different interaction patterns, scenarios, languages, and recording devices. Experiments with representative commercial, open-source, and cascaded systems show that aggregate metrics alone obscure important failure modes, highlighting the need for condition-specific evaluation.

## Data Construction Pipeline

<p align="center">
  <img src="assets/data-construction-pipeline.png" alt="MS-Bench data construction pipeline: sourcing and characterization, condition-space construction, candidate-pool construction, and benchmark-subset selection" width="100%">
</p>

<p align="center"><sub>The MS-Bench construction pipeline consists of sourcing and characterization, condition-space construction, candidate-pool construction, and benchmark-subset selection.</sub></p>

## Benchmark Overview

| Total duration | Recording duration | Speakers | Average overlap | Condition dimensions |
|:--:|:--:|:--:|:--:|:--:|
| **32.72 h** | **1.38–159.07 min** | **2–14** | **21.87%** | **5** |

MS-Bench covers meetings, spontaneous conversations, films and television, podcasts, dinner-party conversations, educational and live-streaming content, in-vehicle interactions, and smart-glasses interactions. The recordings are primarily in Chinese and English, with additional Portuguese, Japanese, Thai, Italian, and Spanish samples. They span heterogeneous capture setups, including microphone arrays, in-cabin recording systems, media soundtracks, and mobile or wearable devices.

## Condition Space

Each recording is assigned a compact condition profile such as `P2-O3-S2-T3-N3`.

| Axis | Recording-level statistic | Condition ranges |
|---|---|---|
| **P · Speaker number** | Number of valid reference speakers | `P0`: 2 · `P1`: 3–4 · `P2`: 5–8 · `P3`: ≥9 |
| **O · Overlap ratio** | Concurrent-speech duration / total reference-speech duration | `O0`: 0 · `O1`: (0, 0.10) · `O2`: [0.10, 0.20) · `O3`: [0.20, 0.40) · `O4`: ≥0.40 |
| **S · Speaker similarity** | Maximum pairwise cosine similarity of speaker embeddings | `S0`: <0.32 · `S1`: [0.32, 0.49) · `S2`: [0.49, 0.65) · `S3`: ≥0.65 |
| **T · Speaker turn interval** | 25th percentile of non-overlapping speaker-turn gaps | `T0`: >0.45 s · `T1`: (0.15, 0.45] · `T2`: (0.06, 0.15] · `T3`: ≤0.06 s |
| **N · Acoustic quality** | `dN = 1 − mean(percentile(DNSMOS), percentile(NISQA))` | `N0`: <0.27 · `N1`: [0.27, 0.51) · `N2`: [0.51, 0.74) · `N3`: ≥0.74 |

The condition labels describe operating ranges rather than a universal ordering of difficulty. Together, they provide an interpretable space for comparing MSASR systems under controlled interaction and acoustic conditions.
