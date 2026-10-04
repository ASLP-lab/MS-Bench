# MS-Bench

MS-Bench is a condition-stratified benchmark for multi-speaker ASR evaluation.

## Branches

- `main`: current production branch used by GitHub Pages. It contains the previous demo design.
- `improve/msbench-demo-v2`: redesigned demo branch. It includes the new page layout, paper-aligned results, condition diagnostics, Condition Explorer, reference-audio cases, data validation scripts, and documentation.

The V2 interface was redesigned with **Taste-Skill**, using the installed skill name `design-taste-frontend`. The design direction is a restrained academic project page with clear typography, accessible contrast, responsive layouts, and limited motion.

## Important data paths

- Canonical metadata: [`benchmark/metadata.jsonl`](benchmark/metadata.jsonl)
- Front-end metadata derived from the canonical file: [`demo-data/sample_metadata.json`](demo-data/sample_metadata.json)
- Summary statistics: [`demo-data/summary.json`](demo-data/summary.json)
- Demo TextGrid files: [`assets/textgrids/`](assets/textgrids/)
- TextGrid and audio mapping for the eight demo cases: [`demo-data/representative_examples.json`](demo-data/representative_examples.json)
- Demo audio excerpts: [`assets/audio/`](assets/audio/)

Each metadata record includes the recording ID, source dataset, language, scenario, recording device, duration, five condition tiers (`P`, `O`, `S`, `T`, `N`), and the corresponding condition statistics.

## Run the V2 demo locally

```bash
git switch improve/msbench-demo-v2
python -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/demo.html?v=20261004-demo-v2
```

## Validate the data

```bash
python scripts/validate_demo_data.py
```

To regenerate the front-end metadata and summary from the canonical metadata:

```bash
python scripts/build_demo_data.py --write
```

The full evaluation notes and schema are in [`docs/evaluation-protocol.md`](docs/evaluation-protocol.md) and [`docs/data-schema.md`](docs/data-schema.md).
