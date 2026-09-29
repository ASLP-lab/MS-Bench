<div align="center">

# MS-Bench

### A Condition-Stratified Benchmark for Multi-Speaker ASR Evaluation

**Chunjiang He\*** · **Zheng Zi\*** · **Bingshen Mu** · **Yurun Li** · **Jingyi Wang** · **Lei Xie†**

ASLP@NPU, Northwestern Polytechnical University

\* Equal contribution &nbsp;&nbsp; † Corresponding author

[![Project page](https://img.shields.io/badge/Project_Page-live-16382c?style=flat-square)](https://aslp-lab.github.io/MS-Bench/)
[![Demo](https://img.shields.io/badge/Interactive_Demo-explore-dc6b43?style=flat-square)](https://aslp-lab.github.io/MS-Bench/demo.html)
[![Paper](https://img.shields.io/badge/Paper-submitted-ae8a48?style=flat-square)](#citation)

</div>

MS-Bench is a condition-stratified benchmark for fine-grained evaluation of multi-speaker automatic speech recognition (MSASR). Instead of reducing performance to a single aggregate score, it characterizes every recording along five conditions that expose different failure modes: **speaker count, overlap ratio, speaker similarity, speaker turn interval, and acoustic quality**.

> MS-Bench asks not only “Which system performs best?”, but also “Under which conversational conditions does it fail, and why?”

## Interactive demo

**Live site:** https://aslp-lab.github.io/MS-Bench/demo.html

The demo provides interactive views of the five condition dimensions, language and duration distributions, recording setups, scenario coverage, overall system results, and playable examples from meetings, education, podcasts, films, and dinner-party conversations. Long recordings are presented as previews of at most five minutes.

## At a glance

| Duration | Speakers | Avg. overlap | Languages | Systems |
|:--:|:--:|:--:|:--:|:--:|
| 32.72 h | 2–14 | 21.87% | 7 | 8 |

The benchmark spans meetings, spontaneous conversations, film and television, podcasts, dinner-party conversations, educational and live-streaming content, in-vehicle interactions, and smart-glasses recordings. It covers primarily Chinese and English, with additional Portuguese, Japanese, Thai, Italian, and Spanish speech.

## Why condition-stratified evaluation?

Existing multi-speaker benchmarks are often tied to a small set of scenarios or conversational conditions. Their aggregate scores can conceal whether a system fails because it cannot recognize overlapped words, confuses acoustically similar speakers, loses attribution around rapid turns, or simply struggles with degraded audio.

MS-Bench organizes evaluation around five complementary axes:

| Dimension | Recording-level representation | What it probes |
|---|---|---|
| Speaker count | Number of reference speakers | Scaling to crowded conversations |
| Overlap ratio | Fraction of concurrent speech | Recognition and attribution under overlap |
| Speaker similarity | Maximum pairwise cosine similarity | Confusion between similar voices |
| Speaker turn interval | 25th percentile of non-overlapping turn gaps | Attribution near rapid speaker changes |
| Acoustic quality | Combined DNSMOS and NISQA percentile rank | Robustness to acoustic degradation |

Recordings are selected by jointly considering condition coverage, difficult-factor co-occurrence, condition-profile diversity, and source diversity, followed by manual quality control.

## Main findings

- **Overlap damages both content and attribution.** High-overlap utterances increase lexical error by **24.2–38.6 percentage points** across all eight systems, and increase wrong-speaker attribution by **3.5–19.1 points**.
- **Similar voices are consistently confused.** Pairwise speaker similarity correlates with speaker confusion for every evaluated system (Spearman’s **ρ = 0.25–0.37**, *p* < 0.05), even on completely non-overlapping speech.
- **Acoustic degradation mainly affects recognition.** It correlates with lexical error across all systems (**ρ = 0.18–0.57**, *p* < 0.05), but generally not with speaker-attribution failures.
- **Speaker switches target “who,” not “what.”** Wrong-speaker attribution rises by **1.51–4.17 points** near non-overlapping turns, while lexical and segmentation penalties are not consistently significant.

## Overall results

Lower is better. Scores are percentages. “Excluded / soft” reports structurally unscorable outputs and parseable degeneration cases separately.

| System | DER ↓ | cpWER ↓ | tcpWER ↓ | WER ↓ | Excluded / soft |
|---|---:|---:|---:|---:|---:|
| **MOSS-Transcribe-Diarize-Pro** | **10.96** | **21.95** | **22.81** | **22.49** | 15 / 2 |
| **MOSS-Transcribe-Diarize** | 12.74 | 24.94 | 26.22 | 25.02 | **0 / 2** |
| DiaScriber | 19.79 | 30.36 | 33.20 | 26.42 | 27 / 1 |
| Qwen3.8-Omni-Flash | 17.97 | 29.43 | 32.59 | 27.86 | 5 / 2 |
| VibeVoice-ASR | 20.19 | 43.41 | 44.76 | 33.11 | 10 / 12 |
| pyannote + Qwen3-ASR | 17.35 | 43.25 | 46.54 | 34.96 | **0 / 1** |
| Doubao-ASR 2.0 | 39.52 | 55.37 | 62.07 | 38.20 | 4 / 26 |
| SoulX-Transcriber | 19.42 | 49.16 | 52.60 | 39.96 | 8 / 30 |

The best aggregate score is not the whole story: DER and cpWER rank several systems differently, revealing that accurate speaker timelines do not necessarily imply accurate word-to-speaker attribution.

## Metrics

- **DER** evaluates the speaker timeline with a 0.5 s collar.
- **cpWER** finds the speaker permutation that minimizes word error.
- **tcpWER** additionally constrains speaker–transcript matching in time, using a 5 s collar.
- **WER** ignores speaker labels and measures transcription content alone.
- **Lexical / segmentation error** separates recognition errors from words inserted or lost because of speech-region detection and segmentation.
- **AttrWrong** is the fraction of reference utterances whose content is attributed to the wrong speaker.

## Repository status

This repository currently hosts the project page and interactive benchmark demo, including compressed scenario previews and the reported system results. The paper, full benchmark metadata, scoring recipes, and release instructions will be linked here as they become publicly available.

```text
MS-Bench/
├── index.html          # project homepage
├── demo.html           # interactive result and condition explorer
└── assets/
    ├── app.js          # shared page interactions and result data
    ├── style.css       # responsive visual system
    ├── mark.svg        # project mark
    └── audio/          # compressed demo excerpts (≤ 5 min each)
```

To preview the site locally:

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Citation

If you find MS-Bench useful, please cite the paper. The final publication entry will replace this submitted-manuscript record when available.

```bibtex
@misc{he2026msbench,
  title  = {{MS-Bench}: A Condition-Stratified Benchmark for Multi-Speaker {ASR} Evaluation},
  author = {He, Chunjiang and Zi, Zheng and Mu, Bingshen and Li, Yurun and Wang, Jingyi and Xie, Lei},
  year   = {2026},
  note   = {Submitted manuscript}
}
```

## Contact

For questions about the benchmark or evaluation protocol, please open a GitHub issue.
