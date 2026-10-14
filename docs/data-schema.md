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

## Demo presentation

The UI uses icons and full names: **Speaker number**, **Overlap ratio**, **Speaker similarity**, **Speaker turn interval**, and **Acoustic quality**. Visible range labels use percentages for overlap and milliseconds for turn intervals. Continuous-condition range labels use interval notation with explicit inclusion/exclusion of endpoints; overlap uses percentages and turn intervals use milliseconds. Acoustic range subtitles describe relative degradation within this benchmark, rather than calibrated perceptual quality ratings. Speaker similarity uses a composite icon of two Tabler wave-sine glyphs and an approximately-equal sign. Overview groups the full Abstract and the visible Construction pipeline figure, following the presentation hierarchy of MINT-Bench Demo. Benchmark composition then presents condition coverage using the original five-axis palette, followed by scenario, language, and duration descriptions. Navigation uses #introduction for Overview; existing #overview links still address the composition section. The measurement disclosure has no icons and lists the definition and exact range of every tier. Recording overlap is time with at least two active reference speakers divided by the entire recording duration, including silence. Canonical P/O/S/T/N IDs and existing URL filter parameters are preserved.

Scenario descriptions and case labels use four presentation groups. The Explorer's **Settings** count counts these groups; canonical scenario metadata remains unchanged.

| Presentation group | Canonical scenarios |
|---|---|
| Meetings | Meeting |
| Conversational speech | Conversation; Dinner-party conversations; In-vehicle interactions; Smart-glasses interactions |
| Media content | Films and television content; Podcasts; Live-streaming content |
| Classroom interactions | Educational content |

Smart-glasses conversations are included under everyday conversational speech. All nine source labels map to exactly one of the four groups.

Languages are described in prose using the summary's primary and additional language lists. The scenario overview is a single paragraph covering the four presentation groups and their examples, including classroom teaching and teacher–student dialogue. The Explorer retains filters and summary statistics; the matching-reference-excerpts list has been removed.

The composition layout groups condition distributions in a full-width panel, followed by a shared Scenarios/Languages panel beside the recording-duration panel. Scenarios use the user-provided prose, and the disclosure is titled Condition definitions and ranges. Smaller viewports stack the panels; container queries handle sidebar-constrained widths. The Explorer labels its overlap statistic Duration-weighted overlap: the complete benchmark uses the paper-reported 21.87%, and filtered subsets use the recording-duration-weighted mean of selected metadata rows.

## Result presentation and diagnostics

The error-metrics view shows System, DER, cpWER, tcpWER, and WER. Excluded and soft-degradation inference-unit counts appear in Output robustness only. Both MOSS systems use inputs up to 90 minutes; VibeVoice-ASR up to 60 minutes; SoulX-Transcriber up to 5 minutes. System display names omit segmentation suffixes.

Each condition-results block has a concise paper-based conclusion in `description`, a `note` describing its comparison and controls, and a `metrics` list of symbols and definitions. A Note panel directly below the dimension tabs shows the current metrics and their definitions, with scientific subscripts. It follows mouse selection, keyboard navigation, and URL restoration; narrow tab strips keep the selected dimension visible. Numerical series and significance flags are unchanged; the duplicate exact-values disclosure is removed.

Overall performance retains concise paper-based accuracy/robustness findings and links to the same-audio model comparison. The WER decomposition feature is removed. Diagnostic numeric values and bars animate from zero to the selected condition’s paper values over 650 ms; changing tabs cancels the previous animation. Reduced-motion preferences show the final values immediately. The blue Note gives short metric definitions and comparison context, followed by a Key finding paragraph.

The range-count and click-to-filter Note appears directly beneath Condition distributions. Measurement definitions follow paper Sections 2.1–2.2 and retain the original tier IDs and endpoints.

## Representative examples

`demo-data/representative_examples.json` links a recording to a local audio excerpt, corrected TextGrid, full-recording condition profile, and reference segments on the excerpt clock. Excerpts are no longer than five minutes. Multiple reference segments may overlap.

The sample browser contains ten excerpts, including a P3 (nine-speaker) case and an O4 meeting. Each sample presents audio and an aligned reference inline. Vertical scroll snapping, a sample sidebar, and cyclic Previous / Next controls select the sample; Loop audio repeats the current excerpt. Selecting another sample pauses previous playback. Transcript clicks seek and play; playback follow scrolls only the transcript. Existing case URLs select the sample directly. Overlap, similarity provenance, and the interactive timeline are retained in an optional disclosure beneath the browser. `scripts/build_demo_cases.py` rebuilds their annotations from the parent workspace's `challenge100_v2_textgrids` and `OpenSource-TestSets`; add `--encode-audio` to encode the three newly selected excerpts. The generated assets themselves are sufficient to serve the demo without that workspace.

- `overlap_regions` identifies intervals with at least two distinct reference speakers. `clip_stats` reports the union duration of these intervals, their fraction of reference speech time, and peak concurrent speakers. These excerpt measurements are separate from the canonical full-recording condition values.
- `speaker_similarity.maximum` retains the source recording's maximum cosine similarity and original speaker labels. Source labels are aligned to corrected reference tracks by dominant interval intersection, not matching speaker numbers. `speaker_mapping` records that alignment and its interval agreement.
- `speaker_similarity.distinct_reference_pair` identifies the highest source pair that maps confidently to two different corrected speakers. When the source maximum's labels map to the same revised speaker, the demo explicitly notes the discrepancy and labels the separate distinct-speaker score. Source embeddings are not recomputed from the excerpt.
- `focus_windows` provides annotation-derived shortcuts to overlap intervals and utterances of the highlighted speaker pair. Any additional semantic listening descriptions should be confirmed by manual listening.

## Prediction interface

`demo-data/case_predictions.json` (schema 1.1.0) now contains traceable display exports for ten excerpts and seven model slots. `scripts/build_case_predictions.py` reads `100_results` manifests and normalized result segments, Qwen token streams, and the verified SoulX split-time manifest. It exports raw text and speaker labels, original timestamps relative to the excerpt clock, source segment/unit indices, SHA-256 hashes, and known input offsets. Unknown offsets remain `null`; such split outputs are labelled `unmapped` rather than assigned invented excerpt times. Status is for the imported display artifact, not the paper’s scoring decision.

The comparison appears below the audio browser, with a prominent Listen & compare button beneath the Overall performance table. Users select two models and inspect the entire exported Reference/Model A/Model B transcripts for the current audio example, without a time-window selector. Playback uses the complete existing example excerpt, rather than the longer source recording. The original audio element is shared: row clicks seek/play, Play audio toggles playback, and a progress slider seeks within the example. All three transcript panes highlight current utterances and independently scroll within their own containers when Follow subtitles is enabled. Switching models synchronizes the new panes to the current audio time; selecting another sample changes the shared audio and transcripts. Model speaker IDs remain local to each input. Speaker IDs and utterance text share the same accessible speaker color in both themes.

The section is titled Audio examples. The primary transcript remains inline and follows playback by default, including seeking to pauses between utterances. Wheel, touch, and keyboard scrolling do not silently turn off following; readers can explicitly uncheck Follow playback to pause automatic scrolling, and re-enable it when ready. Starting playback recenters the current line. Redundant transcript/condition headings, playback instructions, and the TextGrid download button are removed from the interface. Annotation assets remain available to the data pipeline.

The current export has 63 available, three partial/incomplete, and four unaligned model slots; the unaligned slots are SoulX split results with unavailable source offsets. All 3,735 exported segments were verified against source text, raw speaker IDs, timestamps, and hashes. Invalid intervals are never repaired; they remain non-playable rows with an explicit status when present.
