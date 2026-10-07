# Demo implementation status

## Current reference-case update (2026-10-08, main)

- The gallery now contains ten corrected reference excerpts. Japanese phone conversation is removed from the gallery; Full-duplex tutoring is renamed Tutoring conversation. New cases cover nine speakers (P3), high-overlap far-field conversation (O4), and low-similarity live-streaming speech.
- Case details mark reference overlap with shaded timeline bands and highlight the mapped similarity pair with outlined tracks. Timestamp shortcuts support overlap listening and comparing the pair. Similarity provenance distinguishes the original full-recording maximum from revised reference speaker identities, including two source-label merge cases.
- Condition Explorer retains filters, counts, URL state, and curated examples. The matching-recordings list, JSON export, and copy-link buttons have been removed.
- Verified all ten MP3s by full decoding and browser playback; verified all ten detail dialogs, overlap/caption alignment, similarity labels, P3/O4 filters, seeking, and no horizontal page/dialog overflow at 1440 px and 390 px in light and dark modes. Dialog text contrast checks passed. Data validation covers all 99 recordings, seven systems, and ten cases; rebuilding case annotations is idempotent.

## Original implementation tracking

This file tracks the implementation plan against the `improve/msbench-demo-v2` branch. Status is based on repository code and validation, not on the public GitHub Pages deployment.

| Task | Status | Main files | Verification or blocker |
|---|---|---|---|
| M0-1 branch and audit | Complete | this file | Independent branch created from `main` at `eac6646` |
| M0-3 release manifest | Complete | `demo-data/release.json` | JSON validation |
| M0-3 canonical metadata build | Complete | `scripts/build_demo_data.py` | 99 unique recordings derived from `benchmark/metadata.jsonl` |
| M0-3 data validation | Complete | `scripts/validate_demo_data.py` | Reports recording IDs and fields on failure |
| M1-1 paper main table | Complete | `demo-data/leaderboard.json`, `assets/app.js` | Seven systems and paper values checked |
| M1-2 output robustness | Complete | `assets/app.js` | Counts only; retained-unit denominator remains unavailable |
| M1-3 metric protocol | Complete with documented unknowns | `docs/evaluation-protocol.md` | Normalization, tokenization, aggregation, and tool versions remain unavailable |
| M1-4 summary statistics | Complete with one open item | `demo-data/summary.json` | Recording mean is distinct from the unverified paper weighted overlap |
| M2 page hierarchy and overview | Implemented; visual review pending | `demo.html`, `assets/style.css`, `assets/app.js` | Source validation passed; final multi-viewport screenshots still required |
| M3 diagnostics | Complete | `demo-data/condition_results.json`, `assets/app.js` | Table 2 values, signs, nulls, and significance validated |
| M4-A reference cases | Implemented; browser audio review pending | `assets/app.js`, `demo-data/representative_examples.json` | Eight clips, speaker timeline, seek, follow toggle, one active player |
| M4-B model comparison | Data blocked | `demo-data/case_predictions.json` | No verified case-level predictions, offsets, or speaker mappings found |
| M5 Explorer and URL state | Implemented; browser history review pending | `assets/app.js` | Filters, counts, list, export, deep links, and local failures |
| M6 Resources | Complete with truthful statuses | `demo-data/release.json`, `docs/` | Paper, full benchmark, and evaluation code are not marked available |
| M6 Figure 2 | Data blocked | none | Exact error-composition values or a publishable source figure are unavailable |

## Open data questions

- The paper reports 21.87% duration-weighted overlap. Weighting by current recording durations gives approximately 21.82%, so the exact reference weighting still needs confirmation.
- Total inference-unit counts are unavailable. Excluded and soft-degradation counts therefore have no displayed percentage.
- Case-level model predictions, source offsets, and verified speaker mappings are unavailable.
