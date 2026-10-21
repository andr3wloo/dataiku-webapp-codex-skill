#!/usr/bin/env python3
"""Assemble the opt-in paired-sidebar preset into native DSS editor files."""
import argparse
from pathlib import Path


def assemble(output):
    skill = Path(__file__).resolve().parents[1]
    preset = skill / 'assets' / 'paired-sidebars'
    shared = skill / 'assets' / 'starter'
    sources = {
        'body.html': (preset / 'body.html').read_text(),
        'style.css': (preset / 'style.css').read_text(),
        'app.js': '\n\n'.join(p.read_text() for p in [preset / 'config.js', preset / 'panels.js', shared / 'app.js']),
        'backend.py': (shared / 'backend.py').read_text(),
    }
    # The wrapper loads the exact assembled app.js. Resolve preview configuration
    # lazily, after that file defines STANDARD_APP_CONFIG and before it mounts.
    sources['preview-fixture.js'] = (shared / 'preview-fixture.js').read_text()
    sources['preview.html'] = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Paired sidebars fixture preview</title><link rel="stylesheet" href="style.css"><style>body{margin:0}</style></head>
<body><div id="preview-root" role="status">Loading fixture preview…</div>
<script src="preview-fixture.js"></script><script>
Object.defineProperty(window.STANDARD_PREVIEW, 'config', {get() {
  const config = window.STANDARD_APP_CONFIG;
  return {...config, configured:true, displayCap:5, evidenceCap:3,
    agent:{...config.agent, enabled:true}};
}});
(async function () {
  const root = document.getElementById('preview-root');
  try {
    const response = await fetch('body.html');
    if (!response.ok) throw new Error('HTML request failed (' + response.status + ')');
    root.removeAttribute('role'); root.innerHTML = await response.text();
    const script = document.createElement('script'); script.src = 'app.js';
    script.onerror = () => {root.textContent = 'Preview script failed to load. Check the local server.';};
    document.body.append(script);
  } catch (error) {root.textContent = 'Preview unavailable: ' + error.message;}
})();
</script></body></html>
"""
    output.mkdir(parents=True, exist_ok=False)
    for name, content in sources.items():
        (output / name).write_text(content)
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='New directory for editor-ready files')
    args = parser.parse_args()
    try:
        print(assemble(args.output))
    except FileExistsError:
        parser.error('Output directory already exists; use a new directory to preserve your edits.')
