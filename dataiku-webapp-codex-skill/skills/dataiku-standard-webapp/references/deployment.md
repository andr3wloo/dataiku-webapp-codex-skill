# Deployment and offline handoff

## Design prerequisite

Before a visual create/update or design handoff to CoBuild, follow [design review](design-review.md): show a browser-rendered preview, obtain explicit approval of its colors/fonts and visible design, then adapt it and render the final editor files locally. Retain the approved revision and parity evidence with the work. Reuse approval for faithful adaptation; material visible changes require a revised preview and approval. Backend-only changes without visible effects do not require a new design approval. Honor an explicit user override. Target authorization remains necessary and does not approve an unseen design.

## Inspect before changing

Use Dataiku-Headless first, then the user-selected browser unless the user specifies an alternative. Read the installed Headless WebApps guide and its CoBuild route; unsupported MCP operations may be performed through the user-selected browser. This browser fallback takes precedence over Headless’s CoBuild-only/stop-on-gap routing for WebApps, while retaining its other checks. Do not silently substitute CLI, direct REST, or Python API access for the selected Dataiku-Headless/browser route. Discover the instance version, instance identity, project permissions, current settings, code environment, dataset authorizations, and requested libraries. Read command help rather than assuming flags. Never print API keys or store credentials in generated files. Use existing authenticated access. Creating a skill does not authorize creating a live customer WebApp.

Previously inspected definitions (2026-10-14) used `type: STANDARD` and `params.html`, `params.css`, `params.js`, `params.python`. Public API documentation confirms `get_settings().get_raw()` returns a type and params but does not promise every source key for every release. Therefore the merger requires exact STANDARD type and existing string source fields; it refuses missing/ambiguous layouts. Confirm actual settings before a live merge. References:
- https://developer.dataiku.com/latest/api-reference/python/webapps.html
- https://doc.dataiku.com/dss/latest/webapps/standard.html

## Repeatable preflight

Discover supported Headless tools and verify instance identity/version once per target. Use the user-selected browser for operations Headless does not cover. Diagnose an existing connection or permission failure before requesting login or replacing credentials. CLI-specific help/profile steps apply only when the user instructs that alternative. Read-only inspection remains distinct from permission to change the target.

Fetch raw definitions directly to a protected file (`umask 077`, or explicit mode 600), never to chat output. Even encrypted/opaque API-key fields must stay out of reports and generated editor files. `python scripts/inspect_standard_definition.py current.json --compare candidate.json` prints source hashes, selected flags, and changed field paths without printing source/config/credential values. Preserve the complete raw file for rollback and exclude it from version control.

Before starting a backend, inspect the intended existing environment's **actual** pandas/Flask packages and container-image availability. A missing image is a runtime mismatch, not a reason to rebuild shared environments or change execution/security settings blindly. Reuse a verified compatible runtime within the authorized scope; review an execution-mode change separately from the source-only merge.

Run validation and mutation as dependent operations: use tool orchestration that checks exit status, or a fail-fast shell (`set -e`/`&&`). Never place a live apply after an unchecked failed syntax/test command. Use a fresh candidate path for the run, re-fetch settings immediately before merge, and verify only the intended source/settings paths differ. The merger requires Node.js for a supplied JS tab (`--node` selects an available runtime), compiles Python, and atomically writes its candidate only after validation; its success does not itself authorize a live write.

After deployment, re-fetch and compare installed source hashes. For a small frontend fix, run syntax plus the affected interaction check without restarting an unchanged backend. Broaden checks only for new failures or unresolved concerns. Keep a compact target/source manifest and current verification status instead of repeatedly rediscovering the same target or reproducing long reports.

## Update

1. Resolve the exact authorized project and WebApp ID. Fetch complete raw settings and save timestamped rollback JSON securely; unknown and redacted values must remain intact.
2. Confirm STANDARD and inspect all source fields. Stop on incompatible type or unsupported source layout.
3. Run `python scripts/merge_standard_definition.py --definition current.json --html body.html --css style.css --js app.js --output updated.json`. Add `--python backend.py` only if replacing that backend is intended. Omitting Python preserves it. Partial frontend patches are also supported by supplying only changed files.
4. Review semantic diff: only explicitly supplied source fields may change. Configure required backend/library/code-environment/permission settings as a separate reviewed change; the merger never enables them.
5. Apply through the supported Headless/CoBuild route after preview approval, or use the user-selected browser for editor operations it does not support. Re-fetch and compare permitted fields. Do not replace redacted settings with invented values.
6. Restart only if a backend change/configuration needs it; inspect running status, recent logs, frontend console, and network responses. Static apps need no backend health claim. Run browser acceptance checks.
7. Retain rollback JSON and restore instructions for the selected access route using that exact target. If verification fails, report the failure and restore only within the authorized recovery scope. Avoid repeated blind restart/apply loops.

## Browser-only source editing

When complete settings export/import is unavailable, do not fabricate a raw definition or require the JSON merger. Capture every existing source tab and relevant settings in protected rollback storage; syntax-check the candidate files and review their diff. Replace only the intended tabs through the user-selected browser, preserve all other settings, then re-open the tabs to compare installed source and validate the rendered app. Record exact target and restore steps. If a tab cannot be read completely or restored, stop the update and report the gap. Do not print sensitive configuration in snapshots/reports.

## Create

Require an authorized project key and WebApp name. After preview approval, create native STANDARD through supported Headless/CoBuild or the user-selected browser, record its returned ID, inspect the generated tabs/settings, and follow the applicable source merge or browser-only diff/verification process. Do not construct settings from memory. For a static app omit Python. For the data starter enable Flask using verified instance settings and select an environment with `dataiku`, pandas, and Flask available. Use DSS's supplied `app`; no explicit listening port or `app.run()`.

Authorize only necessary datasets and validate the effective browser-user/run-as access model. If an agent is enabled, configure its supported SDK invocation and verified caller identity. If durable history is requested, additionally verify a pre-provisioned folder, overwrite/concurrency guarantees, and cross-user isolation; session-only chat requires no history folder.

## Offline deliverable

Return body.html, style.css, app.js, optional backend.py, and a concise setup checklist:
- Replace/configure dataset and required columns in Python; set JS `configured=true` and matching column names.
- Paste the three editor-tab files as raw contents; do not paste preview.html or fixtures.
- Enable the Dataiku JS library, dataset authorizations, and optional Flask backend/environment. Save and inspect preview/logs.
- Agent disabled requires no extra setup. If enabled, configure ID/name/three starters and verified adapters; explain remaining integration gates.
- List packages and any upstream Flow proposal separately. Label local preview evidence and unverified live behavior distinctly.
