#!/usr/bin/env python3
"""Flag scaffold copy and review-harness imports in customer editor HTML."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import re

TERMS = ('synthetic', 'dummy', 'illustrative', 'demo', 'preview', 'fixture', 'mock', 'stub',
         'lorem ipsum', 'ai-powered', 'unlock insights', 'seamless experience',
         'published evidence', 'results are current', 'production-ready', 'prepared for')


def audit_html(source, allow_terms=()):
    findings = []
    allowed = {term.casefold() for term in allow_terms}

    class Surface(HTMLParser):
        ignored = 0

        def check(self, value):
            for term in TERMS:
                if term not in allowed and re.search(r'(?<!\w)' + re.escape(term) + r'(?!\w)', value, re.I):
                    findings.append((self.getpos()[0], 'surface copy: ' + term))

        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            if tag in ('script', 'style'):
                self.ignored += 1
            for key in ('aria-label', 'title', 'placeholder', 'alt'):
                self.check(attrs.get(key, ''))
            dependency = attrs.get('src', '') if tag == 'script' else attrs.get('href', '') if tag == 'link' else ''
            if re.search(r'(preview|fixture)(?:[-./]|$)', dependency, re.I):
                findings.append((self.getpos()[0], 'review-harness import in editor HTML'))

        def handle_endtag(self, tag):
            if tag in ('script', 'style'):
                self.ignored = max(0, self.ignored - 1)

        def handle_data(self, data):
            if not self.ignored:
                self.check(data)

    Surface().feed(source)
    return sorted(set(findings))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--html', type=Path, required=True)
    parser.add_argument('--allow-term', action='append', default=[], help='Intentional business term; record the reason in QA')
    args = parser.parse_args()
    results = audit_html(args.html.read_text(), args.allow_term)
    for line, finding in results:
        print(f'{args.html}:{line}: {finding}')
    if not results:
        print('No flagged scaffold copy or review-harness imports in editor HTML. Runtime copy still needs browser review.')
    raise SystemExit(bool(results))
