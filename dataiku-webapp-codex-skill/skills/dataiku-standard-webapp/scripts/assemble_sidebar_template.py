#!/usr/bin/env python3
"""Copy the canonical sidebar starter into editor files plus a separate review harness."""
import argparse
from pathlib import Path


def assemble(output):
    shared = Path(__file__).resolve().parents[1] / 'assets' / 'starter'
    names = ('body.html', 'style.css', 'app.js', 'backend.py', 'preview.html', 'preview-fixture.js')
    sources = {name: (shared / name).read_text() for name in names}
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
