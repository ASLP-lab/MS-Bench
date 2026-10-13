# Demo implementation status

## Four scenario categories (2026-10-14)

- Overview, Explorer setting counts, and sample labels now use Meetings, Conversational speech, Media content, and Classroom interactions.
- Conversational speech includes dinner-party, in-vehicle, smart-glasses, and other everyday conversations. Media content includes podcasts, films/television, and live streams. Classroom interactions covers educational speech.
- All 99 recordings are assigned once: Meetings 51, Conversational speech 29, Media content 17, and Classroom interactions 2. Original source metadata is retained for provenance.

## Condition-first overview and inline sample browser (2026-10-14)

- Condition coverage now precedes scenarios, languages, and recording duration. Restored the original Speaker number, Overlap ratio, Speaker similarity, Speaker turn interval, and Acoustic quality names and the original five-axis colors.
- Measurement definitions contain no icons and enumerate all 21 source tier ranges. The overlap definition explicitly uses the full recording duration; excerpt evidence retains its separate speech-time denominator. Scenario descriptions distinguish organized discussion, informal social interaction, audience-facing content, teaching, and device-specific capture contexts.
- Replaced the case gallery and modal with a vertical sample browser. Audio and aligned text are visible immediately. A sample sidebar, native scroll snapping, keyboard navigation, and cyclic Previous / Next controls select samples. Loop audio repeats the selected excerpt; selecting another sample pauses previous playback. Transcript clicks seek and play; following playback scrolls only the transcript. Optional overlap, similarity, and timeline details remain available below the browser.
- Verified all ten samples and audio sources, actual audio looping, click-to-play captions, exclusive playback, manual/follow transcript scrolling, wheel/keyboard/sidebar navigation, timeline seeking, old case/filter links, Explorer links, and browser history. Checked 320, 390, 768, 1024, 1440, and 1920 px in light/dark modes with visible audio/transcript and no page overflow. Overview/filter/sample-browser accessibility checks pass. Canonical validation passes for 99 recordings, seven systems, and ten cases.

## Readable conditions and scenario descriptions (2026-10-14)

- Replaced language and scenario charts with prose. Scenarios now form five presentation groups: meetings and discussions, everyday and social conversations, media and entertainment, learning and tutoring, and in-vehicle and wearable interactions. Conversation and dinner-party conversations share the social group.
- Replaced prominent P/O/S/T/N codes with full condition names, locally bundled Tabler icons, and readable ranges throughout coverage, filters, diagnostic tabs, and audio cases. Exact measurements and source codes remain in a collapsed disclosure; canonical metadata and existing filter URLs remain compatible.
- The Explorer counts the same five setting groups used in overview and case labels. Mobile coverage uses a two-column layout without horizontal scrolling.
- Verified all 21 condition ranges, combined filters, disabled ranges, reset, and existing deep links. All ten audio dialogs load valid audio metadata. Checked 320, 390, 768, 1024, 1440, and 1920 px in both light and dark modes with no page/dialog overflow or clipped range labels. Accessibility checks passed for overview, filters, case profiles, and open dialog condition details in both themes. Browser playback advances normally. Canonical data validation still passes for 99 recordings, seven systems, and ten cases.

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
