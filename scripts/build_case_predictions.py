#!/usr/bin/env python3
"""Export traceable model-output excerpts from the local 100_results workspace.

This is a display export, not a scoring run. Raw speaker IDs and invalid timing
are preserved. Utterance text is never trimmed at a time-window boundary.
"""
from __future__ import annotations
import csv
import hashlib
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
RESULTS = WORKSPACE / '100_results'
TOKEN_RE = re.compile(r'<sos><(?P<start>\d+(?:\.\d+)?)>(?P<text>[^<>]*)<(?P<end>\d+(?:\.\d+)?)><speaker(?P<speaker>\d+)><eos>', re.DOTALL)


def csv_rows(path: Path, delimiter=','):
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f, delimiter=delimiter))


def source_unit(path: Path, payload: dict, offset: float, issues=None):
    return {'source': str(path.relative_to(WORKSPACE)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'source_start_seconds': offset, 'segments': payload.get('segments', []), 'issues': list(issues or []),
            'incomplete': payload.get('status') not in {None, 'success'} or payload.get('finish_reason') == 'length' or bool(payload.get('invalid_output_lines'))}


def main():
    examples = json.loads((ROOT / 'demo-data/representative_examples.json').read_text())
    models = json.loads((ROOT / 'demo-data/leaderboard.json').read_text())
    directories = {'moss_pro': 'MOSS-Transcribe-Diarize-Pro', 'moss': 'MOSS-Transcribe-Diarize', 'vibevoice': 'VibeVoice-ASR'}
    manifests = {key: {r['audio_id']: r for r in csv_rows(RESULTS / directory / 'result_manifest.csv')} for key, directory in directories.items()}
    qwen_manifest = {Path(r['output_file']).stem: r for r in map(json.loads, (RESULTS / 'Qwen3.8-Omni-Flash-smoke/manifest.jsonl').read_text().splitlines())}
    doubao_file = RESULTS / 'doubao_api/doubao_result.jsonl'
    doubao = {r['id']: r for r in map(json.loads, doubao_file.read_text().splitlines())}
    split_rows = {r['segment_id']: r for r in csv_rows(WORKSPACE / 'split_under_5min_textgrid/segments.tsv', '\t')}
    cases = []
    for example in examples:
        recording_id = example['recording_id']
        clip_start = example['clip_start_seconds']
        clip_end = clip_start + example['clip_duration_seconds']
        outputs = []
        for model in models:
            model_id = model['system_id']
            units = []
            missing = False
            unmapped_sources = []
            if model_id in directories:
                manifest = manifests[model_id].get(recording_id)
                if not manifest:
                    missing = True
                else:
                    paths = [Path(x.strip()) for x in manifest['destination_result'].split(';') if x.strip()]
                    for part, path in enumerate(paths):
                        if not path.is_file():
                            missing = True
                            continue
                        data = json.loads(path.read_text())
                        # Multi-part outputs must carry an explicit offset; do not guess.
                        offset = data.get('chunk_start')
                        if offset is None and part != 0:
                            continue
                        issues = ['Model identity differs from requested model'] if 'source_model=' in manifest.get('issues', '') else []
                        units.append(source_unit(path, data, float(offset or 0), issues))
            elif model_id == 'qwen_omni':
                dataset, key = recording_id.split('::', 1)
                key = key.replace('中国人__', 'zh__').replace('外国人__', 'en__').replace('20260511下午', '20260511pm').replace('20260513上午', '20260513am')
                stem = dataset + '__' + key
                path = RESULTS / 'Qwen3.8-Omni-Flash-smoke' / (stem + '.txt')
                if path.is_file():
                    raw = path.read_text(); matches = list(TOKEN_RE.finditer(raw))
                    data = {'segments': [{'start': float(m['start']), 'end': float(m['end']), 'speaker': 'speaker' + m['speaker'], 'text': m['text']} for m in matches]}
                    manifest = qwen_manifest.get(stem, {})
                    if raw != '<soc>' + ''.join(m.group(0) for m in matches) + '<eoc>' or manifest.get('status') in {'failed', 'saved_invalid'}:
                        data['status'] = 'partial'
                    units.append(source_unit(path, data, 0))
                else:
                    missing = True
            elif model_id == 'doubao':
                if recording_id in doubao:
                    units.append(source_unit(doubao_file, doubao[recording_id], 0))
                else:
                    missing = True
            elif model_id == 'pyannote_qwen':
                path = RESULTS / 'cascade_infer/result_challenge100/asr' / (recording_id + '.json')
                if path.is_file():
                    units.append(source_unit(path, json.loads(path.read_text()), 0))
                else:
                    missing = True
            elif model_id == 'soulx':
                paths = sorted((RESULTS / 'soulx-transcriber-results').glob(recording_id + '*.json'))
                for path in paths:
                    split = split_rows.get(path.stem)
                    if split:
                        offset = float(split['original_start'])
                    elif path.stem == recording_id:
                        offset = 0
                    else:
                        unmapped_sources.append({'source': str(path.relative_to(WORKSPACE)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'source_start_seconds': None})
                        continue  # No verified source offset for this part.
                    units.append(source_unit(path, json.loads(path.read_text()), offset))
                missing = not units
            selected = []
            provenance = list(unmapped_sources)
            invalid_count = 0
            incomplete = missing
            issues = set()
            for index, unit in enumerate(units):
                incomplete |= unit['incomplete']
                issues.update(unit['issues'])
                provenance.append({k: v for k, v in unit.items() if k not in {'segments', 'issues', 'incomplete'}})
                provenance_index = len(provenance) - 1
                for raw_index, segment in enumerate(unit['segments']):
                    try:
                        start, end = float(segment['start']), float(segment['end'])
                    except (TypeError, ValueError, KeyError):
                        invalid_count += 1
                        continue
                    if not math.isfinite(start) or not math.isfinite(end):
                        invalid_count += 1
                        continue
                    valid = 0 <= start < end
                    invalid_count += not valid
                    source_start = start + unit['source_start_seconds']
                    source_end = end + unit['source_start_seconds']
                    intersects = source_end > clip_start and source_start < clip_end if valid else clip_start <= source_start < clip_end or clip_start <= source_end < clip_end
                    if not intersects:
                        continue
                    selected.append({'start': source_start - clip_start, 'end': source_end - clip_start,
                                     'speaker': str(segment.get('speaker', 'Unknown')), 'text': str(segment.get('text', '')),
                                     'valid_timing': valid, 'source_unit': provenance_index, 'source_segment': raw_index})
            selected.sort(key=lambda x: (x['start'], x['source_unit'], x['source_segment']))
            if not units:
                status = 'unmapped' if unmapped_sources else 'missing'
            elif invalid_count or issues:
                status = 'invalid'
            elif incomplete:
                status = 'partial'
            else:
                status = 'available'
            if unmapped_sources:
                issues.add('Source offsets for split inputs are unavailable.')
            outputs.append({'system_id': model_id, 'status': status, 'invalid_timestamps': invalid_count,
                            'warnings': sorted(issues), 'sources': provenance, 'segments': selected})
        cases.append({'recording_id': recording_id, 'slug': example['slug'], 'clip_start_seconds': clip_start,
                      'clip_duration_seconds': example['clip_duration_seconds'], 'outputs': outputs})
    data = {'schema_version': '1.1.0', 'data_version': '20261018-text-seek',
            'systems': [{'id': m['system_id'], 'name': m['system']} for m in models], 'cases': cases}
    output = ROOT / 'demo-data/case_predictions.json'
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    counts = {}
    for case in cases:
        for item in case['outputs']:
            counts[item['status']] = counts.get(item['status'], 0) + 1
    print(f'Exported {len(cases)} excerpts × {len(models)} models: {counts}')


if __name__ == '__main__':
    main()
