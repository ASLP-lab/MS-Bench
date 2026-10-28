# Demo implementation status

## Missing model output audit and backfill (2026-10-29)

- Checked all twelve audio examples and seven systems against `100_results`. SoulX outputs for five examples existed but were omitted because their newer split inputs are absent from `split_under_5min_textgrid/segments.tsv`. Recover their offsets only after checking consecutive part numbers, result identity, valid chunk durations, and agreement with the original recording duration to within 1 ms. Preserve explicit manifest offsets for older stream-copy splits.

| Sample | Recording | Restored SoulX utterances |
|---|---|---:|
| 03, Podcast | `BenchFilms_ZH::part004_e12074b4` | 38 |
| 04, Film | `BenchFilms_ZH::000049_part018` | 18 |
| 08, Meeting | `alimeeting_far::R8005_M8009` | 168 |
| 11, Film | `BenchFilms_ZH::000102_part014` | 79 |
| 12, Natural conversation | `MLC-SLM_Workshop-Evaluation_Set_1::English__1126_003_phone` | 70 |

- MOSS Pro on sample 08 has no transcription in `100_results`: its abnormal result records `inference_failed_upload_timeout`. Show an explicit inference-failed status and audio-upload-timeout warning in English and Chinese. Retain the Qwen Omni and VibeVoice partial-output statuses on that sample. Paper scores and original result files are unchanged.
- Export now contains 81 available, two partial, and one failed slots, with 6,446 utterances. Verified every exported utterance against its raw source text, speaker, timestamps, source indices, and SHA-256 hash (112 files), and confirmed all previously present utterances are unchanged. Added split-mapping regression tests and prediction coverage checks to the demo validator. Bumped script/data cache versions for the updated browser export.
- Browser verification passed for all 84 model selections, actual audio playback and transcript-click seeking in all five restored cases (including second-part offsets), and English/Chinese failure messages. No JavaScript errors or failed resource requests were observed. Seven regression tests and validation of 99 recordings, twelve examples, and 84 output slots pass. Playback testing used a local static server with HTTP byte-range support.

## Natural Chinese copy and free transcript seeking (2026-10-18)

- Rename samples 8 and 10 to Meeting. Use Podcast / 播客 for sample 3, Film / 影视剧 for samples 4 and 11, and Natural conversation / 自然交谈 for sample 12; canonical scenarios and audio remain unchanged. Replace sample 7 with AMI ES2014d, a four-speaker English meeting with 11.57% overlap and a longer turn interval. Retire the old film sample's slug rather than attaching different audio to its old result identity.
- Rewrite the Chinese abstract, pipeline caption, condition explanations, results commentary, diagnostic notes/findings, and playback instructions for Chinese readers. Preserve numerical results, analysis assumptions, and source transcript wording. Use shorter controls such as 边听边看 and 恢复自动跟随.
- Allow manual browsing while audio continues. Pointer interaction pauses automatic following before a row can move; wheel and keyboard browsing pause following too. Clicking any valid reference/model caption seeks, starts playback, and resumes following in all panes. Metadata-aware seeking handles a cold audio load, and only the latest seek request is applied. Keep the follow-control height stable so showing the resume button cannot move a row during a click.


- Verified actual nested-text clicks in reference and both model columns across all twelve cases, scrolling while playback continues, resume controls, keyboard activation, metadata-not-ready playback, and touch taps. Source text is unchanged across language switches. Checked five viewport widths in light/dark Chinese layouts and accessibility. Verified all 6,073 model utterances against source text, speaker IDs, timestamps, and SHA-256 hashes; canonical data validation passes.

## English/Chinese interface and compact audio details (2026-10-18)

- Apply Taste-Skill as a preservation pass (design variance 3, motion intensity 2, visual density 5). Add a compact header language button using existing colors, borders, radii, and focus styles; retain navigation anchors and the page structure. Chinese layout uses the existing system font stack.
- Translate navigation, abstract, pipeline caption, condition definitions, results, analysis notes/findings, sample metadata, and playback controls. Keep English model/metric identifiers and source transcripts unchanged. The explicit catalog supports dynamic controls, accessible labels, scientific subscripts, saved preference, and locale URLs without rebuilding audio or resetting application state.
- Merge audio instructions into one Note. Simplify the five requested example titles and provide Chinese equivalents. Remove source speaker labels, overlap summary, and recording-device details from the optional panel, preserving underlying provenance and timeline annotations.


- Verified language switching during real playback without changing the selected sample, models, filters, or analysis dimension. Confirmed source transcript text is identical across languages, all five diagnostic notes retain scientific subscripts, locale URL/preference restoration, requested names and removed details, five viewport widths in both themes/languages, and accessibility. Replaced invalid numeric aria-label usage with visually hidden final values so animated diagnostics remain readable to assistive technology. Canonical validation passes for 99 recordings, seven systems, and twelve examples.

## Move sample context into the audio list (2026-10-16)

- Move Sample number, normalized scenario, and language into each left-hand audio entry, alongside its title. Keep duration out of the list. Remove the duplicate metadata row from the right-hand detail header.
- Use a compact three-line hierarchy and preserve mobile horizontal navigation, selection, focus states, and the current palette.

## Curated audio examples and exact condition values (2026-10-16)

- Apply Taste-Skill as a focused preservation pass (design variance 3, motion intensity 2, visual density 5): keep the blue-gray palette, original five-axis colors, and established layout. Use a quieter index/title sidebar and give concrete condition measurements stronger type, with ranges secondary. Existing viewport, focus, contrast, and playback-follow behavior remain part of validation.
- Remove the former Sample 06 (smart-glasses gathering); add three English examples spanning an overlapping workplace meeting, multi-character film dialogue, and a clear everyday conversation. Twelve examples now cover all four normalized scenario groups. Rename retained examples by content type.
- Play sources shorter than ten minutes in full. The former Fast podcast exchange is Podcast discussion, with its complete 373.03-second recording. Rebuild the extended audio, corrected transcript timelines, overlap annotations, and model display exports together.
- Keep the currently followed line visible after viewport reflow; resize observation updates reference and model panes. Version audio URLs alongside data to refresh extended recordings.
- Show exact condition values above ranges. Check continuous values against the requested metrics JSONL; retain corrected-reference speaker numbers and established acoustic degradation. Keep source speaker-number discrepancies in provenance. NOTSOFAR's missing source-pair labels remain explicitly unavailable.


- Verified all 6,061 exported model utterances against raw text, speaker IDs, source offsets, and SHA-256 hashes. Confirmed deterministic rebuilds, all twelve audio durations, playback beyond the podcast's former cutoff, all reference/model panes, five viewport widths in both themes, accessible contrast/focus, and active-line visibility after resize. Canonical validation passes for 99 recordings and seven systems.

## Shorter audio title and continuous reference following (2026-10-14)

- Shorten the section title to Audio examples. Keep the main reference transcript following playback after wheel, touch, and keyboard interactions, rather than silently disabling the checkbox. Retain explicit pause/resume controls for readers.
- Follow the nearest reference utterance during pauses, and recenter on playback start. Model comparison panes continue to follow the same shared audio.

## Full-example transcript playback and clearer comparison entry (2026-10-14)

- Edit main directly. Replace the 30-second comparison selector with shared Play/Pause and progress controls for the entire existing example excerpt. Render all exported utterances and independently highlight/scroll Reference, Model A, and Model B with playback; Follow subtitles can pause scrolling while retaining highlights. Model changes follow the current playback time.
- Put the comparison entry beneath the Overall performance table in a subtle blue panel, with a prominent Listen & compare button and no underline.
- Rename the listening section Audio examples and model comparison. Remove the TextGrid download button, redundant condition/transcript headings, and timestamp instruction. Match speaker IDs and utterance text colors, with accessible light/dark theme adjustments. Keep raw data, original excerpt boundaries, and local speaker identity unchanged.
- Validate actual playback, seeking, all three transcript panes, model changes during playback, follow controls, five viewport widths in both themes, accessibility, and unchanged independent README edits.

## Raw model comparison and animated condition results (2026-10-14)

- Remove Where transcription errors arise and its exported figure. Retain useful overall accuracy/robustness findings and add a direct link to same-audio model-output comparison.
- Add Reference/Model A/Model B comparison below the audio browser. Users choose two of seven models and a 30-second window; the shared sample audio supports play/pause, transcript-line seeking, and selection of its current window. Sample changes reset the comparison window.
- Export ten cases from 100_results with a reproducible stdlib script. Preserve text, speaker IDs local to each input, timestamps, source indices, and source hashes. Show imported availability/incomplete states; explicitly mark four SoulX slots without verified split offsets as unaligned. No scoring or speaker matching is fabricated.
- Shorten the blue metric Note and use a distinct Key finding paragraph beneath it. Clicking a dimension animates numbers and bars from zero to the corresponding paper values in 650 ms, including overlap’s 27.3. Rapid switches cancel earlier animation; reduced-motion settings show final values immediately. Accessible labels expose final numeric values.
- Verified all 3,735 exported segments against raw source text, speaker IDs, timestamp offsets, and SHA-256 hashes. Tested numeric motion, rapid switches, reduced motion, seven model options, all ten samples, window selection, unaligned/partial states, actual audio playback and seeking, 320/390/768/1101/1440 px in light/dark modes, and accessibility. Canonical metadata validation still passes.

## Overall findings and visible dynamic metrics (2026-10-14)

- Reviewed raw result layouts in 100_results and corresponding intermediate score summaries. Several older summaries differ from the current paper; keep the established paper leaderboard and use the verified paper Figure 2 for error composition.
- Add short accuracy/robustness findings and the original vector WER decomposition figure, with explanations of lexical recognition and speech segmentation components. All seven WER totals match the leaderboard after the figure’s one-decimal rounding.
- Figure provenance: vector export of icassp_2027/MS-Bench/fig2.pdf using pdftocairo; source SHA-256 ab27aa481a17431d73259a84db08ead020fbfc29fb9c9d733a86230763f13c93. No component values are estimated or reconstructed.
- Move the condition Note beneath the tabs. Each dimension now exposes an explicit metric-symbol/definition list with scientific subscripts, alongside its analysis method. Mouse, keyboard, and deep-link restoration update the same panel. Mobile tab strips keep the selected dimension visible without moving the page vertically.
- Verified all five metric sets, notes, keyboard/deep-link behavior, SVG loading, paper/table consistency, and unchanged condition series. Checked 320, 390, 768, 1101, and 1440 px in light/dark modes; accessibility checks pass. The figure scrolls horizontally within its frame on phones. Canonical validation passes for 99 recordings, seven systems, and ten cases.

## Scenario prose and shared panel (2026-10-14)

- Replace the four scenario definition items with the supplied single-paragraph description, retaining all four scenario groups and their examples.
- Combine Scenarios and Languages in one bordered panel with a subtle internal divider, alongside Recording duration; stack the panels on smaller screens. Preserve existing theme colors and filtering categories.
- Rename the measurement disclosure to Condition definitions and ranges; retain all 21 source tiers and their paper-based definitions.
- Checked 390, 1101, and 1440 px in light/dark modes for overflow and accessibility, and reviewed desktop/mobile screenshots. JavaScript syntax and whitespace checks pass.

## Composition layout and overlap aggregate (2026-10-14)

- Taste-Skill preservation pass: retain the academic blue-gray tokens, existing five-axis colors, 1100 px content width, navigation, and filtering behavior. Give condition distributions an independent full-width panel; group four scenarios in a two-column definition list; place language and duration panels side by side below. Use consistent inset spacing, borders, and headings. Mobile layouts stack these blocks; container queries prevent compressed tiles when the sidebar narrows the content column.
- Replace Mean recording overlap with Duration-weighted overlap. The complete-benchmark display uses the paper-reported 21.87%; filtered selections compute sum(duration × overlap ratio) / sum(duration), shown to two decimal places. Tooltips identify the aggregate source.
- Data provenance: weighting the current canonical per-recording fields produces 21.8194%, while the paper reports 21.87%. The paper-reported display is explicit rather than altering canonical metadata; filtered values remain computed from the selected metadata rows.
- Verified paper aggregate, filtered weighting, and reset; checked 320, 390, 768, 900, 1101, 1440, and 1920 px in light/dark modes with no horizontal overflow. Composition and Explorer accessibility checks pass. Reviewed wide, narrow-sidebar, and mobile layouts.

## Result tables and condition analysis refinement (2026-10-14)

- Remove exclusion and soft-degradation columns from Error metrics; retain them in Output robustness. Correct both MOSS input policies to ≤90 min and simplify the SoulX display name. Returning from robustness restores sorting by a visible error metric.
- Remove View exact values. Each of the five dimensions now presents a short conclusion based on the current paper analysis; the section Note updates with metrics, units, comparison design, controls, and significance. Keyboard navigation and analysis URL restoration follow the same update path. Numeric results and significance flags remain unchanged.
- Update measurement definitions using paper Sections 2.1–2.2, including CAM++ segments, maximum pairwise cosine similarity, turn-interval quantiles, and acoustic score percentile ranks. Preserve all 21 tier definitions.
- Move the range-count and filter guidance beneath Condition distributions with a Note prefix.
- Verified table headings and sorting, both MOSS policies, system naming, all five dynamic notes, keyboard/deep-link behavior, all source tiers, and numerical-data preservation. Canonical data validation passes for 99 recordings, seven systems, and ten cases. Tested 390, 768, 1101, and 1440 px in light/dark modes; accessibility checks pass after improving chart-axis text contrast.

## Caption panel and condition copy cleanup (2026-10-14)

- Present the construction pipeline description in a bordered blue-gray panel, using existing light/dark theme colors. Remove the sentence-ending manual-validation clause from the description.
- Remove the duplicated five-dimension characterization sentence from the Benchmark composition note and the interval-bracket explanation above the distribution tiles. Preserve the original Abstract and the click-to-filter guidance.
- Rename Recording conditions to Condition distributions and retain spacing above the tiles.
- Reviewed desktop and mobile caption screenshots in light/dark modes; Overview and composition accessibility checks pass at 390 and 1440 px, with no page overflow. JavaScript syntax and whitespace checks pass.

## Paper-width layout and pipeline summary (2026-10-14)

- Match the reference MINT-Bench Overview container width with a 1100 px maximum white content column; cap the combined sidebar and content frame at 1340 px. Header alignment follows the same frame.
- Enlarge the pipeline image by about 10% on wide screens, increasing its figure cap to 1040 px and reducing frame padding to 10 px. Keep fluid mobile sizing and the full-size image link.
- Replace the short stage-list caption with a concise description grounded in icassp_2027/MS-Bench/Template.tex, Sections 2.1–2.4: characterize recordings, define condition ranges, construct the candidate pool, select for coverage and diversity, and manually validate audio and annotations.
- Verified 320, 390, 768, 1024, 1100, 1101, 1440, and 1920 px in light/dark modes, including the navigation breakpoint, with no horizontal overflow. Reviewed desktop/mobile Overview and composition screenshots. JavaScript syntax and whitespace checks pass.

## Overview spacing refinement (2026-10-14)

- Cap the centered construction figure at 960 px to keep its embedded lettering proportional to surrounding text on wide screens; retain its full-size link and responsive image proportions.
- Increase spacing between the hero logo, title, example buttons, and statistics, plus the gap between each statistic and its description. Use smaller spacing adjustments on phones.
- Verified 320, 390, 768, 1440, and 1920 px in light and dark modes, with no horizontal overflow; reviewed desktop and mobile screenshots. JavaScript syntax and whitespace checks pass.

## Overview chapter experiment (2026-10-14, preview/overview-layout)

- Following the MINT-Bench Demo hierarchy, the new Overview chapter contains Abstract and Construction pipeline. The full abstract is moved out of the hero without rewriting it, and the construction figure is visible rather than collapsed.
- The original Benchmark overview is renamed Benchmark composition. It continues to contain condition distributions, scenarios, languages, and recording duration. The title and headline statistics remain in the compact hero.
- Sidebar navigation adds Overview at #introduction and labels the existing #overview section Composition, preserving old composition links. The construction image has intrinsic dimensions and a full-size link.
- This experiment is developed in the separate MS-Bench-overview-layout worktree on preview/overview-layout; the original working directory's files are preserved.
- Verified exact abstract preservation, visible image loading, chapter order, all six navigation items and active states, mobile menu, existing composition/case/filter links, and filter operation. Checked 320, 390, 768, and 1440 px in light/dark modes for overflow; Overview and composition accessibility checks pass. Data validation still passes for 99 recordings, seven systems, and ten cases.

## Overview copy, range labels, and similarity icon (2026-10-14)

- Speaker similarity now uses two original Tabler wave-sine glyphs with an approximately-equal sign, consistently in overview, filters, diagnostics, active filters, and sample profiles. The original axis palette is preserved.
- Removed Matching reference excerpts from the Explorer, along with its renderer and styles. Filters and recording statistics remain available; the inline audio sample browser is unchanged.
- The overview Note quotes the exact five-dimension characterization sentence from the existing paper abstract. A separate paragraph explains recording counts, benchmark percentages, and clicking a range to filter the Explorer.
- Continuous dimensions use interval notation, including [10%, 20%) and [150, 450) ms, with a bracket convention beneath Recording conditions. Acoustic range subtitles retain their relative-degradation descriptions. Discrete speaker-number ranges remain explicit.
- Removed the scenario introduction and tightened spacing. Classroom interactions is described as classroom teaching, tutoring, and teacher-student dialogue.
- Verified all 21 filters, the original-source sentence, range labels, removed excerpt list, four scenarios, retained case/filter links, and inline audio playback. Checked 320, 390, 768, and 1440 px in light and dark modes for overflow/clipped labels; overview and Explorer accessibility checks pass. Canonical data validation still passes for 99 recordings, seven systems, and ten cases.

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
