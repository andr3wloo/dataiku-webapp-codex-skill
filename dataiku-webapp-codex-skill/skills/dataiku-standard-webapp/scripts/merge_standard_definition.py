#!/usr/bin/env python3
"""Patch explicitly supplied source tabs in round-tripped STANDARD settings."""
import argparse
import copy
import json
import os
from pathlib import Path
import tempfile
import shutil
import subprocess

FIELDS = {'html', 'css', 'js', 'python'}


def merge_definition(definition, **sources):
    if not isinstance(definition, dict) or definition.get('type') != 'STANDARD':
        raise ValueError('Expected an exact type=STANDARD round-tripped definition')
    params = definition.get('params')
    if not isinstance(params, dict):
        raise ValueError('Missing params object; inspect actual instance schema')
    supplied = {key: value for key, value in sources.items() if value is not None}
    if not supplied or set(supplied) - FIELDS:
        raise ValueError('Supply one or more supported source tabs')
    for key, value in supplied.items():
        if key not in params or not isinstance(params[key], str):
            raise ValueError(f'Expected existing string params.{key}; inspect actual schema')
        if not isinstance(value, str):
            raise ValueError(f'{key} source must be text')
        if key == 'python':
            compile(value, 'backend.py', 'exec')
    merged = copy.deepcopy(definition)
    merged['params'].update(supplied)
    return merged


def validate_javascript(path, node='node'):
    executable = shutil.which(node)
    if not executable:
        raise ValueError('Node.js is required to syntax-check a supplied JS tab; pass --node with an available runtime path.')
    result = subprocess.run([executable, '--check', str(path)], capture_output=True, text=True)
    if result.returncode:
        # Node diagnostics can echo complete source lines. Do not print source/opaque values.
        raise ValueError('JavaScript syntax check failed; repair the supplied JS file before merging.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--definition', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--node', default='node', help='Node.js executable used to validate a supplied JS tab')
    for field in sorted(FIELDS):
        parser.add_argument('--' + field, type=Path)
    args = parser.parse_args()
    if args.output.resolve() == args.definition.resolve():
        parser.error('Output must not overwrite the rollback definition')
    try:
        sources = {key: getattr(args, key).read_text() for key in FIELDS if getattr(args, key)}
        result = merge_definition(json.loads(args.definition.read_text()), **sources)
        if args.js:
            validate_javascript(args.js, args.node)
    except (ValueError, SyntaxError, OSError) as error:
        parser.exit(2, 'Source merge blocked: ' + str(error) + '\n')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(dir=args.output.parent, prefix='.standard-')
    try:
        with os.fdopen(fd, 'w') as handle:
            json.dump(result, handle, indent=2, ensure_ascii=False)
            handle.write('\n')
        os.replace(temp, args.output)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)
    print('Updated source tabs only: ' + ', '.join(sorted(sources)))


if __name__ == '__main__':
    main()
