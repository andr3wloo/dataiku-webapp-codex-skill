import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('assembly', ROOT / 'scripts/assemble_sidebar_template.py')
assembly = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assembly)


class AssemblyTests(unittest.TestCase):
    def test_assembled_candidate_is_self_contained_and_preserves_edits(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / 'preview'
            assembly.assemble(output)
            self.assertEqual((output / 'backend.py').read_bytes(), (ROOT / 'assets/starter/backend.py').read_bytes())
            expected = '\n\n'.join((ROOT / path).read_text() for path in (
                'assets/paired-sidebars/config.js', 'assets/paired-sidebars/panels.js', 'assets/starter/app.js'))
            self.assertEqual((output / 'app.js').read_text(), expected)
            from html.parser import HTMLParser
            dependencies = []
            class Parser(HTMLParser):
                def handle_starttag(self, tag, attrs):
                    attrs = dict(attrs)
                    if tag in ('script', 'link'):
                        value = attrs.get('src') or attrs.get('href')
                        if value:
                            dependencies.append(value)
            Parser().feed((output / 'preview.html').read_text())
            for name in dependencies:
                self.assertTrue((output / name).is_file(), name)
            subprocess.run(['node', '--check', str(output / 'app.js')], check=True, capture_output=True)
            (output / 'body.html').write_text('user edits')
            with self.assertRaises(FileExistsError):
                assembly.assemble(output)
            self.assertEqual((output / 'body.html').read_text(), 'user edits')
