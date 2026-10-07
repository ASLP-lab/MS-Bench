# Evaluation protocol

This document records only protocol details confirmed by the current paper draft and repository data. Unknown details are left explicit.

## Metrics

- **DER** measures speaker diarization error with a 0.5-second collar.
- **cpWER** measures speaker-attributed transcription error under the optimal speaker permutation.
- **tcpWER** adds a 5-second temporal constraint to the permutation-based score.
- **WER** ignores speaker labels and measures lexical recognition error.

The reported values are percentages. Lower is better.

## Inference policies

- MOSS-Transcribe-Diarize-Pro accepts inputs up to 90 minutes.
- VibeVoice-ASR accepts inputs up to 60 minutes.
- SoulX-Transcriber is evaluated on segments up to 5 minutes.
- Other systems process complete recordings according to the current paper draft.
- Each independently submitted window is scored against its matching reference window. Speaker IDs are not assumed to remain consistent across independent requests.

## Output validity

`Excluded` counts inference units whose output cannot be scored reliably. `Soft Deg.` counts degraded outputs that remain parseable and are retained for scoring. Soft-degradation units are therefore not excluded units.

For MOSS-Transcribe-Diarize-Pro, the 15 excluded units comprise 3 API refusals and 12 invalid timestamp outputs. Other systems have no verified reason breakdown in the current repository. The total number of inference units per system is unavailable, so retained-unit percentages are not reported.

## Diagnostic definitions

- Overlap compares utterances with zero overlap exposure against utterances with at least 50% overlap exposure within the same inference unit.
- Similarity correlates pairwise speaker similarity with pairwise confusion on completely non-overlapping utterances.
- Acoustic analysis correlates degradation score `d_N` with `E_lex`, `E_attr`, and `R_time` for non-overlapping utterances away from speaker switches.
- Turn analysis compares attribution error inside and outside a +/-0.5-second neighborhood around non-overlapping speaker switches.
- Speaker-number analysis controls for dataset identity and overlap, excludes P3, and does not evaluate SoulX-Transcriber.

Significance markers reproduce Table 2 of the author-confirmed 2026-10-04 draft. The repository does not yet contain the complete statistical-test configuration or confidence intervals.

## Details still required for exact reproduction

- Model and API version identifiers and evaluation dates
- Audio resampling and channel-selection commands
- Text normalization and language-specific tokenization
- Scoring-tool names and versions
- Aggregation formula and bootstrap cluster unit
- Per-system inference-unit manifests

No executable scoring command is provided until those details and the scoring implementation are available.
