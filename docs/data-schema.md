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

## Interface languages

`assets/i18n.js` provides an explicit English/Chinese UI catalog. The compact header button switches the current page without reconstructing audio elements or resetting filters, selected models, analysis tabs, playback position, or transcript scroll. `?lang=en` and `?lang=zh` override the saved `ms-bench-language` preference; English is the default for a first visit. The document language, title, accessible control labels, and description update with the selected UI language.

Static text and newly rendered interface text share the same catalog. Scientific metric definitions and notes retain their subscript markup in both languages. Transcript rows, original speaker IDs, scores, model names, and source assets are excluded from translation. Chinese UI copy does not translate or replace the source audio/transcripts; the paper's embedded construction figure retains its source artwork and receives a translated caption and alt text.

## Representative examples

`demo-data/representative_examples.json` links a recording to local audio, a corrected TextGrid, a full-recording condition profile, and reference segments on the playback clock. Recordings shorter than ten minutes play in full; longer recordings retain a five-minute excerpt. `source_duration_seconds` and `audio_scope` distinguish the original duration and whether playback is complete. Multiple reference segments may overlap.

The sample browser contains twelve examples. The original Sample 06 (`glasses`) is removed; English examples include a seven-speaker NOTSOFAR meeting, a fourteen-speaker science-fiction clip, and a two-speaker conversation about films. Sample 07 now uses the four-speaker AMI ES2014d meeting in place of the retired Chinese film excerpt (`many-speakers`). Titles use content types within the four scenario groups. The sidebar shows the sample number, localized title, normalized scenario, and language, without a duration. Samples 1, 7, 8, and 10 use Meeting (会议); sample 3 uses Podcast (播客), samples 4 and 11 use Film (影视剧), and sample 12 uses Natural conversation (自然交谈). Canonical scenarios and audio remain unchanged. Sample number, scenario, and language are omitted from the right-hand detail header. Condition tiles show exact speaker number, overlap percentage, maximum similarity, turn-interval Q25 in milliseconds, and acoustic degradation d_N above their corresponding ranges. Each sample presents audio and an aligned reference inline. Vertical scroll snapping, a sample sidebar, and cyclic Previous / Next controls select the sample; Loop audio repeats the current excerpt. Selecting another sample pauses previous playback. Transcript clicks seek and play; playback follow scrolls only the transcript. Existing case URLs select the sample directly. A compact similarity and timeline disclosure remains beneath the browser. The source-speaker-label disclosure, overlap-summary block, and recording-device row are removed from the interface; provenance and overlap annotations remain in the data. The single section Note combines sample selection, scrolling, and shared playback instructions; the toolbar no longer repeats the scrolling instruction. `scripts/build_demo_cases.py` rebuilds their annotations from the parent workspace's `challenge100_v2_textgrids` and `OpenSource-TestSets`; add `--encode-audio` to encode new or duration-changed audio. The curated selection lives in `CASE_SPECS`. The podcast source is 373.03 seconds and is played whole; the NOTSOFAR meeting and English film clip are also played whole. The AMI recording is longer than ten minutes, so the selected example is its first 299.9 seconds. The generated assets themselves are sufficient to serve the demo without that workspace.

- `overlap_regions` identifies intervals with at least two distinct reference speakers. `clip_stats` reports the union duration of these intervals, their fraction of reference speech time, and peak concurrent speakers. These excerpt measurements are separate from the canonical full-recording condition values.
- `speaker_similarity.maximum` retains the source recording's maximum cosine similarity and original speaker labels when supplied. The NOTSOFAR and AMI aggregate sources provide the maximum but no pair labels, so its mapping remains explicitly unavailable, without invented labels. Source labels are aligned to corrected reference tracks by dominant interval intersection, not matching speaker numbers. `speaker_mapping` records that alignment and its interval agreement.
- `speaker_similarity.distinct_reference_pair` identifies the highest source pair that maps confidently to two different corrected speakers. When the source maximum's labels map to the same revised speaker, the demo explicitly notes the discrepancy and labels the separate distinct-speaker score. Source embeddings are not recomputed from the excerpt.
- `focus_windows` provides annotation-derived shortcuts to overlap intervals and utterances of the highlighted speaker pair. Any additional semantic listening descriptions should be confirmed by manual listening.

`stats_source` links each example to `OpenSource-TestSets/all_testsets_all_metrics.jsonl` by dataset and key, and retains its original speaker number for auditing. Continuous overlap, similarity, and turn-interval values are checked against the source file. Speaker number uses the revised benchmark reference rather than older source annotation counts (the podcast, for example, has two revised speakers rather than the source file's three). Acoustic degradation uses the benchmark's established DNSMOS/NISQA percentile transformation stored in `benchmark/metadata.jsonl`; raw MOS scores are not substituted for d_N.

## Prediction interface

`demo-data/case_predictions.json` (schema 1.1.0) now contains traceable display exports for twelve audio examples and seven model slots. `scripts/build_case_predictions.py` reads `100_results` manifests and normalized result segments, Qwen token streams, and the verified SoulX split-time manifest. It exports raw text and speaker labels, original timestamps relative to the excerpt clock, source segment/unit indices, SHA-256 hashes, and known input offsets. Unknown offsets remain `null`; such split outputs are labelled `unmapped` rather than assigned invented excerpt times. Status is for the imported display artifact, not the paper’s scoring decision.

The comparison appears below the audio browser, with a prominent Listen & compare button beneath the Overall performance table. Users select two models and inspect the entire exported Reference/Model A/Model B transcripts for the current audio example, without a time-window selector. Playback uses each example's full selected audio: complete recordings below ten minutes and five-minute excerpts for longer sources. The original audio element is shared: row clicks seek/play, Play audio toggles playback, and a progress slider seeks within the example. All three transcript panes highlight current utterances and independently scroll within their own containers when Follow subtitles is enabled. Switching models synchronizes the new panes to the current audio time; selecting another sample changes the shared audio and transcripts. Model speaker IDs remain local to each input. Speaker IDs and utterance text share the same accessible speaker color in both themes.

The section is titled Audio examples. The primary transcript remains inline and follows playback by default, including seeking to pauses between utterances. Pointer interaction, wheel scrolling, and keyboard browsing pause follow in the transcript being inspected, allowing readers to browse without being pulled back to the playhead. The main transcript exposes Resume follow; model columns share their Follow subtitles control. Clicking a reference or model utterance seeks and starts the shared audio at that utterance, re-enables following in all panes, and synchronizes highlighting. The seek is deferred until audio metadata is available when needed, while play is requested synchronously from the user gesture. Starting playback recenters the current line. Redundant transcript/condition headings, playback instructions, and the TextGrid download button are removed from the interface. Annotation assets remain available to the data pipeline.

The current export has 76 available, three partial/incomplete, and five unaligned model slots; the unaligned slots are SoulX split results with unavailable source offsets. All 6,073 exported segments were verified against source text, raw speaker IDs, timestamps, offsets, and SHA-256 hashes. Invalid intervals are never repaired; they remain non-playable rows with an explicit status when present.
