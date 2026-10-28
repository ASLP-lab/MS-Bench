"""Regression checks for recovering SoulX times without shifting older splits."""
import json
import tempfile
import unittest
from pathlib import Path

from build_case_predictions import soulx_offsets, source_unit


class SoulXOffsetsTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.recording = 'dataset::recording'

    def parts(self, durations):
        paths = []
        for index, duration in enumerate(durations):
            path = Path(self.directory.name) / f'{self.recording}__part{index:04d}.json'
            path.write_text(json.dumps({'key': path.stem, 'audio_duration_seconds': duration}))
            paths.append(path)
        return paths

    def test_complete_new_split_set(self):
        paths = self.parts([200.09, 172.94])
        offsets, recovered = soulx_offsets(paths, {}, self.recording, 373.03)
        self.assertEqual(offsets, {paths[0].stem: 0, paths[1].stem: 200.09})
        self.assertEqual(recovered, set(offsets))

    def test_single_part_and_rounded_source_duration(self):
        paths = self.parts([296.635])
        self.assertEqual(soulx_offsets(paths, {}, self.recording, 296.635)[0], {paths[0].stem: 0})
        paths = self.parts([189.54, 253.4791875])
        self.assertEqual(len(soulx_offsets(paths, {}, self.recording, 443.019188)[0]), 2)

    def test_missing_first_middle_or_final_part_stays_unmapped(self):
        paths = self.parts([200, 200, 150])
        for incomplete in [paths[1:], paths[::2], paths[:-1]]:
            with self.subTest(paths=incomplete):
                self.assertEqual(soulx_offsets(incomplete, {}, self.recording, 550), ({}, set()))

    def test_duration_mismatch_or_invalid_duration_stays_unmapped(self):
        for durations in [[200.09, 172.95], [0], [-1], [float('nan')], [float('inf')], [301], [None]]:
            with self.subTest(durations=durations):
                self.assertEqual(soulx_offsets(self.parts(durations), {}, self.recording, 373.03), ({}, set()))

    def test_planned_times_override_stream_copy_overruns(self):
        paths = self.parts([233.216, 245.567625])
        rows = {paths[0].stem: {'original_start': '0'}, paths[1].stem: {'original_start': '233.135'}}
        self.assertEqual(soulx_offsets(paths, rows, self.recording, 478.702625),
                         ({paths[0].stem: 0, paths[1].stem: 233.135}, set()))
        # Never fill holes in a partially known manifest by accumulating durations.
        del rows[paths[1].stem]
        self.assertEqual(soulx_offsets(paths, rows, self.recording, 478.783625), ({paths[0].stem: 0}, set()))

    def test_wrong_recording_identity_stays_unmapped(self):
        paths = self.parts([100])
        paths[0].write_text(json.dumps({'key': 'another-recording', 'audio_duration_seconds': 100}))
        self.assertEqual(soulx_offsets(paths, {}, self.recording, 100), ({}, set()))

    def test_upload_failure_is_distinct_from_incomplete_transcription(self):
        # Use this test file as a hashable source inside the workspace.
        failed = source_unit(Path(__file__), {'status': 'failed', 'special_marker': 'inference_failed_upload_timeout'}, 0)
        self.assertTrue(failed['failed'])
        self.assertIn('Inference failed: audio upload timed out.', failed['issues'])
        partial = source_unit(Path(__file__), {'status': 'success', 'finish_reason': 'length', 'segments': [{'text': 'partial'}]}, 0)
        self.assertFalse(partial['failed'])
        self.assertTrue(partial['incomplete'])


if __name__ == '__main__':
    unittest.main()
