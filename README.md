<div align="center">

<img src="assets/mark.svg" alt="MS-Bench icon" width="104">

<h2>MS-Bench: A Condition-Stratified Multi-Speaker ASR Benchmark</h2>

[![Paper](https://img.shields.io/badge/Paper-arXiv%3A2610.25824-b31b1b.svg)](https://arxiv.org/abs/2610.25824)
[![Demo](https://img.shields.io/badge/Demo-Project%20Page-blue.svg)](https://aslp-lab.github.io/MS-Bench/)

</div>

**MS-Bench** is a condition-stratified benchmark for fine-grained multi-speaker automatic speech recognition (MSASR) evaluation. It integrates public and internal benchmarks across diverse scenarios, languages, and recording devices, with recordings stratified by **speaker number, overlap ratio, speaker similarity, speaker turn interval, and acoustic quality**.

The leaderboard, detailed evaluation results, and Condition Explorer are available on the [demo page](https://aslp-lab.github.io/MS-Bench/).

## Benchmark Construction

<p align="center">
  <img src="assets/data-construction-pipeline.png" alt="MS-Bench construction pipeline: sourcing and characterization, condition-space construction, candidate-pool construction, and benchmark-subset selection" width="100%">
</p>

Recordings are collected and characterized, organized into a condition space and candidate pool, and selected for condition coverage and source diversity.

## Benchmark Overview

| Total duration | Condition dimensions | Speakers | Duration-weighted overlap | Evaluated systems |
|:--:|:--:|:--:|:--:|:--:|
| **32.72 h** | **5** | **2-14** | **21.87%** | **7** |

MS-Bench covers meetings, spontaneous conversations, films and television content, podcasts, dinner-party conversations, educational content, live-streaming content, in-vehicle interactions, and smart-glasses interactions. The recordings mainly contain Chinese and English speech, with additional samples in Portuguese, Japanese, Thai, Italian, and Spanish. Recording devices include microphone arrays, in-cabin recording systems, and mobile devices.

## Condition Space

Each tier shows its condition range, recording count, and percentage of the 99 recordings.

| Dimension | Tier 0 | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|:--|:--:|:--:|:--:|:--:|:--:|
| **P: Speaker number**<br><sub>Number of reference speakers</sub> | **P0**<br><sub>2 speakers</sub><br><sub>27 / 27.3%</sub> | **P1**<br><sub>3-4 speakers</sub><br><sub>29 / 29.3%</sub> | **P2**<br><sub>5-8 speakers</sub><br><sub>33 / 33.3%</sub> | **P3**<br><sub>≥9 speakers</sub><br><sub>10 / 10.1%</sub> | - |
| **O: Overlap ratio**<br><sub>Recording-level overlap</sub> | **O0**<br><sub>0</sub><br><sub>23 / 23.2%</sub> | **O1**<br><sub>(0, 0.10)</sub><br><sub>22 / 22.2%</sub> | **O2**<br><sub>[0.10, 0.20)</sub><br><sub>10 / 10.1%</sub> | **O3**<br><sub>[0.20, 0.40)</sub><br><sub>26 / 26.3%</sub> | **O4**<br><sub>[0.40, 1.00]</sub><br><sub>18 / 18.2%</sub> |
| **S: Speaker similarity**<br><sub>Maximum pairwise cosine similarity</sub> | **S0**<br><sub>[0.00, 0.32)</sub><br><sub>9 / 9.1%</sub> | **S1**<br><sub>[0.32, 0.49)</sub><br><sub>12 / 12.1%</sub> | **S2**<br><sub>[0.49, 0.65)</sub><br><sub>31 / 31.3%</sub> | **S3**<br><sub>[0.65, 1.00]</sub><br><sub>47 / 47.5%</sub> | - |
| **T: Speaker turn interval**<br><sub>25th percentile; higher tiers mean shorter intervals</sub> | **T0**<br><sub>≥0.45 s</sub><br><sub>10 / 10.1%</sub> | **T1**<br><sub>[0.15, 0.45) s</sub><br><sub>14 / 14.1%</sub> | **T2**<br><sub>[0.06, 0.15) s</sub><br><sub>42 / 42.4%</sub> | **T3**<br><sub>[0.00, 0.06) s</sub><br><sub>33 / 33.3%</sub> | - |
| **N: Acoustic quality**<br><sub>d_N; higher tiers mean poorer quality</sub> | **N0**<br><sub>[0.00, 0.27)</sub><br><sub>7 / 7.1%</sub> | **N1**<br><sub>[0.27, 0.51)</sub><br><sub>5 / 5.1%</sub> | **N2**<br><sub>[0.51, 0.74)</sub><br><sub>25 / 25.3%</sub> | **N3**<br><sub>[0.74, 1.00]</sub><br><sub>62 / 62.6%</sub> | - |

View the interactive condition distributions on the [demo page](https://aslp-lab.github.io/MS-Bench/demo.html#overview).

Acoustic quality is represented by `d_N = 1 - (p_D + p_N) / 2`, where `p_D` and `p_N` are the percentile ranks of DNSMOS P.835 and NISQA scores. Larger values indicate poorer acoustic quality.
