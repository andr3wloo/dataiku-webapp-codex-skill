import copy
import importlib.util
import io
import json
from pathlib import Path
import sys
import types
import unittest
import subprocess
import tempfile
import shutil

ROOT = Path(__file__).resolve().parents[1]

def module(path, name, extra=None):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    value.__dict__.update(extra or {})
    spec.loader.exec_module(value)
    return value

MERGER = module(ROOT / 'scripts/merge_standard_definition.py', 'merger')
INSPECTOR = module(ROOT / 'scripts/inspect_standard_definition.py', 'inspector')

class App:
    logger = types.SimpleNamespace(exception=lambda *args: None)
    def route(self, *args, **kwargs):
        return lambda function: function

request = types.SimpleNamespace(content_length=0, get_json=lambda **kw: {})
# Shim imports only while loading; tests do not claim real Flask behavior.
previous = {name: sys.modules.get(name) for name in ('flask', 'dataiku')}
sys.modules['flask'] = types.SimpleNamespace(jsonify=lambda value: value, request=request)
sys.modules['dataiku'] = types.SimpleNamespace()
BACKEND = module(ROOT / 'assets/starter/backend.py', 'backend', {'app': App()})
for name, value in previous.items():
    if value is None:
        del sys.modules[name]
    else:
        sys.modules[name] = value

class Folder:
    def __init__(self): self.files = {}
    def upload_data(self, key, data): self.files[key] = data
    def get_download_stream(self, key): return io.BytesIO(self.files[key])

class DefinitionTests(unittest.TestCase):
    def setUp(self):
        self.definition = {'type': 'STANDARD', 'id': 'exact', 'future': {'redacted': '********'},
                           'params': {'html': 'old', 'css': '', 'js': '', 'python': '# keep', 'backendEnabled': True}}
    def test_preserves_everything_except_requested_sources(self):
        original = copy.deepcopy(self.definition)
        changed = MERGER.merge_definition(self.definition, html='<main>New</main>', js='void 0;')
        self.assertEqual(self.definition, original)
        self.assertEqual(changed['params']['python'], '# keep')
        changed['params']['html'] = original['params']['html']; changed['params']['js'] = original['params']['js']
        self.assertEqual(changed, original)
    def test_rejects_incompatible_and_unknown_layout(self):
        for kind in ['STREAMLIT', 'STANDARD_PLUGIN', None]:
            with self.assertRaises(ValueError): MERGER.merge_definition({**self.definition, 'type': kind}, html='x')
        del self.definition['params']['js']
        with self.assertRaises(ValueError): MERGER.merge_definition(self.definition, js='x')
    def test_backend_compile_and_no_implicit_backend(self):
        del self.definition['params']['python']
        self.assertNotIn('python', MERGER.merge_definition(self.definition, html='new')['params'])
        with self.assertRaises(ValueError): MERGER.merge_definition(self.definition, python='pass')
        self.definition['params']['python'] = ''
        with self.assertRaises(SyntaxError): MERGER.merge_definition(self.definition, python='def broken(')

class BackendTests(unittest.TestCase):
    def setUp(self):
        self.old = dict(BACKEND.CONFIG)
        BACKEND.CONFIG.update(dataset='published', history_replace_safe=True, agent_id='configured-on-server')
        self.rows = [{'category': 'North', 'value': i} for i in range(1, 11)] + [{'category': 'South', 'value': 20}]
        self.original_records = BACKEND.dataset_records
        BACKEND.dataset_records = lambda: self.rows
        self.folder = Folder()
        self.identity = 'alice'
        self.calls = []
        def adapter(message, context, turns):
            self.calls.append((message, context, list(turns)))
            return 'Grounded answer'
        BACKEND.register_agent_adapter(adapter, lambda: self.identity, self.folder)
    def tearDown(self):
        BACKEND.CONFIG.clear(); BACKEND.CONFIG.update(self.old)
        BACKEND.dataset_records = self.original_records
        BACKEND.register_agent_adapter(None)
    def payload(self, value): request.get_json = lambda **kwargs: value
    def test_totals_before_caps_filter_and_empty(self):
        summary = BACKEND.summarize(self.rows, {}, 2)
        self.assertEqual(summary['kpis'], {'count': 11, 'value': 75})
        self.assertEqual(summary['shown_rows'], 2); self.assertTrue(summary['truncated'])
        self.assertEqual(BACKEND.summarize(self.rows, {'category': 'North'}, 2)['kpis']['value'], 55)
        self.assertEqual(BACKEND.summarize([], {}, 2)['kpis']['count'], 0)
        for filters in [{'dataset': 'other'}, {'category': 'nope'}]:
            with self.assertRaises(ValueError): BACKEND.summarize(self.rows, filters, 2)
    def test_missing_columns_and_invalid_values(self):
        class Frame:
            columns = ['category']
        fake = types.SimpleNamespace(Dataset=lambda name: types.SimpleNamespace(get_dataframe=lambda: Frame()))
        original_dataiku = BACKEND.dataiku; BACKEND.dataiku = fake
        try:
            with self.assertRaisesRegex(ValueError, 'missing columns: value'): self.original_records()
        finally: BACKEND.dataiku = original_dataiku
        with self.assertRaises(ValueError): BACKEND.summarize(self.rows, {}, True)
    def test_agent_rebuilds_context_and_history_isolates_users(self):
        self.payload({'message': 'What changed?', 'filters': {'category': 'North'}, 'context': {'allow_global_search': True, 'visible_evidence': {'secret': 'bad'}}})
        answer = BACKEND.agent_route(); self.assertIn('Persistent', answer['history_mode'])
        ctx = self.calls[-1][1]
        self.assertEqual(answer['context_receipt']['validation'], 'server_recomputed')
        self.assertEqual(answer['context_receipt']['context'], ctx)
        self.assertEqual(ctx['model_context']['kpis'], {'count': 10, 'value': 55.0})
        self.assertFalse(ctx['allow_global_search']); self.assertNotIn('bad', json.dumps(ctx)); self.assertEqual(ctx['visible_evidence']['total_rows'], 10)
        alice_key = BACKEND.history_key()
        self.identity = 'bob'; self.assertNotEqual(BACKEND.history_key(), alice_key)
        self.payload({}); self.assertEqual(BACKEND.history_route()['turns'], [])
        self.identity = 'alice'; self.assertEqual(len(BACKEND.history_route()['turns']), 2)
        BACKEND.clear_history_route(); self.assertEqual(BACKEND.history_route()['turns'], [])
    def test_missing_identity_and_failed_storage_return_answer_session_only(self):
        self.identity = None
        self.payload({'message': 'Explain', 'filters': {}, 'history': [{'role': 'user', 'content': 'Earlier'}]})
        result = BACKEND.agent_route(); self.assertEqual(result['history_mode'], 'Session-only history')
        self.assertEqual(self.calls[-1][2][0]['content'], 'Earlier'); self.assertEqual(self.folder.files, {})
        self.identity = 'alice'
        self.folder.upload_data = lambda *args: (_ for _ in ()).throw(OSError('unavailable'))
        self.assertEqual(BACKEND.agent_route()['answer'], 'Grounded answer')
        self.assertEqual(BACKEND.agent_route()['history_mode'], 'Session-only history')
    def test_selected_display_row_outside_evidence_cap_is_verified(self):
        BACKEND.CONFIG['evidence_cap'] = 2
        selected = {'category': 'North', 'value': 10}
        self.payload({'message': 'Inspect this row', 'filters': {'category': 'North'},
                      'context': {'selected_item': {'details': selected}}})
        result = BACKEND.agent_route()
        ctx = result['context_receipt']['context']
        self.assertEqual(ctx['visible_evidence']['shown_rows'], 2)
        self.assertEqual(ctx['selected_item']['details'], selected)
        self.payload({'message': 'Inspect', 'filters': {'category': 'South'},
                      'context': {'selected_item': {'details': selected}}})
        self.assertIsNone(BACKEND.agent_route()['context_receipt']['context']['selected_item'])
    def test_sdk_adapter_passes_context_and_history_before_current_prompt(self):
        events = []
        completion = types.SimpleNamespace(
            with_context=lambda value: events.append(('context', value)),
            with_message=lambda value, role: events.append((role, value)),
            execute=lambda: types.SimpleNamespace(text=' Answer '))
        project = types.SimpleNamespace(get_agent=lambda agent_id: types.SimpleNamespace(as_llm=lambda: types.SimpleNamespace(new_completion=lambda: completion)))
        sdk = types.SimpleNamespace(api_client=lambda: types.SimpleNamespace(get_project=lambda key: project), default_project_key=lambda: 'PROJECT')
        original = BACKEND.dataiku; BACKEND.dataiku = sdk
        try:
            result = BACKEND.dataiku_agent_adapter('Now', {'allow_global_search': False}, [{'role': 'user', 'content': 'Before'}])
            self.assertEqual(result, 'Answer')
            self.assertEqual(events[0], ('context', {'dashboard_context': {'allow_global_search': False}}))
            self.assertEqual(events[1][0], 'system')
            self.assertEqual(json.loads(events[1][1].split('Dashboard context JSON:\n', 1)[1]), {'allow_global_search': False})
            self.assertEqual(events[2:], [('user', 'Before'), ('user', 'Now')])
        finally: BACKEND.dataiku = original
    def test_model_visible_context_rejects_oversize_and_nonfinite_payloads(self):
        for context in [{'text': '\u6f22' * 9000}, {'value': float('nan')}]:
            with self.assertRaises(ValueError): BACKEND.agent_context_message(context)

    def test_unconfigured_agent_fails_closed(self):
        BACKEND.register_agent_adapter(None); self.payload({'message': 'Explain', 'filters': {}})
        result, status = BACKEND.agent_route(); self.assertEqual(status, 400); self.assertIn('not configured', result['error'])



class SafeToolingTests(unittest.TestCase):
    def test_summary_never_prints_sources_or_opaque_values(self):
        definition = {'type': 'STANDARD', 'id': 'target', 'apiKey': 'SENSITIVE_SENTINEL',
                      'config': {'token': 'SENSITIVE_SENTINEL'},
                      'params': {'js': 'const secret = "SENSITIVE_SENTINEL";', 'backendEnabled': True}}
        encoded = json.dumps(INSPECTOR.summary(definition))
        self.assertNotIn('SENSITIVE_SENTINEL', encoded)
        self.assertIn('sha256', encoded)
        changed = copy.deepcopy(definition); changed['params']['js'] = 'void 0;'
        self.assertEqual(INSPECTOR.changed_paths(definition, changed), ['params.js'])
    @unittest.skipUnless(shutil.which('node'), 'Node runtime unavailable')
    def test_invalid_js_cli_stops_before_output_without_echoing_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); before = root / 'before.json'; js = root / 'app.js'; after = root / 'after.json'
            before.write_text(json.dumps({'type': 'STANDARD', 'params': {'js': ''}, 'apiKey': 'OPAQUE_SENTINEL'}))
            js.write_text('const SENSITIVE_SENTINEL = ;')
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/merge_standard_definition.py'),
                '--definition', str(before), '--js', str(js), '--output', str(after)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0); self.assertFalse(after.exists())
            self.assertNotIn('SENSITIVE_SENTINEL', result.stdout + result.stderr)
            self.assertNotIn('OPAQUE_SENTINEL', result.stdout + result.stderr)
    @unittest.skipUnless(shutil.which('node'), 'Node runtime unavailable')
    def test_valid_js_cli_preserves_unknown_fields_and_protects_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); before = root / 'before.json'; js = root / 'app.js'; after = root / 'after.json'
            definition = {'type': 'STANDARD', 'params': {'js': '', 'backendEnabled': False}, 'apiKey': 'opaque', 'future': {'keep': True}}
            before.write_text(json.dumps(definition)); js.write_text('const ready = true;')
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/merge_standard_definition.py'),
                '--definition', str(before), '--js', str(js), '--output', str(after)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            candidate = json.loads(after.read_text()); candidate['params']['js'] = ''
            self.assertEqual(candidate, definition); self.assertEqual(after.stat().st_mode & 0o777, 0o600)

if __name__ == '__main__': unittest.main()
