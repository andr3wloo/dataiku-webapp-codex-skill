import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('surface_audit', ROOT / 'scripts/audit_app_surface.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class SurfaceAuditTests(unittest.TestCase):
    def test_detects_hidden_banner_accessible_copy_and_harness_import(self):
        result = audit.audit_html('<p hidden>Fixture preview · synthetic data</p><button aria-label="Demo">Open</button><script src="preview-fixture.js"></script>')
        self.assertTrue(any('synthetic' in message for _, message in result))
        self.assertTrue(any('demo' in message for _, message in result))
        self.assertTrue(any('import' in message for _, message in result))

    def test_technical_metadata_and_real_operational_caveats_are_not_surface_copy(self):
        self.assertEqual(audit.audit_html('<script>const fixture = 1;</script><!-- preview --><p>Session-only history · Showing 5 of 12 matching records</p>'), [])
        self.assertEqual(audit.audit_html('<button>Preview report</button>', ['preview']), [])
        self.assertEqual(audit.audit_html('<p>Demographics</p>'), [])

    def test_canonical_editor_html_is_clean(self):
        self.assertEqual(audit.audit_html((ROOT / 'assets/starter/body.html').read_text()), [])
