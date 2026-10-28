#!/usr/bin/env python3
"""Summarize a raw DSS definition without printing source or opaque credential values."""
import argparse
import hashlib
import json
from pathlib import Path

SOURCE_FIELDS = ('html', 'css', 'js', 'python')


def summary(definition):
    if not isinstance(definition, dict):
        raise ValueError('Definition must be an object')
    params = definition.get('params', {})
    if not isinstance(params, dict):
        raise ValueError('params must be an object')
    sources = {}
    for field in SOURCE_FIELDS:
        value = params.get(field)
        sources[field] = {'present': isinstance(value, str)}
        if isinstance(value, str):
            sources[field].update(bytes=len(value.encode('utf-8')),
                                  sha256=hashlib.sha256(value.encode('utf-8')).hexdigest())
    # Deliberate allowlist: never dump params/config, API keys, or source excerpts.
    return {key: definition.get(key) for key in ('type', 'projectKey', 'id', 'name')} | {
        'sources': sources,
        'flags': {key: params.get(key) if isinstance(params.get(key), bool) else None
                  for key in ('backendEnabled', 'backendAPIAccessEnabled', 'forceAuthentication')},
    }


def changed_paths(before, after, prefix=''):
    if isinstance(before, dict) and isinstance(after, dict):
        result = []
        for key in sorted(set(before) | set(after)):
            path = prefix + '.' + key if prefix else key
            if key not in before or key not in after:
                result.append(path)
            else:
                result.extend(changed_paths(before[key], after[key], path))
        return result
    return [] if before == after else [prefix]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('definition', type=Path)
    parser.add_argument('--compare', type=Path, help='Report changed field paths against this candidate; no values')
    args = parser.parse_args()
    value = json.loads(args.definition.read_text())
    result = summary(value)
    if args.compare:
        result['changed_paths'] = changed_paths(value, json.loads(args.compare.read_text()))
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
