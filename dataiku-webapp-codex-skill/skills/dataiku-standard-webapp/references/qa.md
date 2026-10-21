# Verification

## Design review evidence

For visual refinement, follow the user-triggered recommendation and refinement route in [Impeccable integration](impeccable.md) to batch desktop/narrow inspection and fixes into bounded visual passes. This complements the acceptance checks below and does not waive required correctness or live-integration checks.

For visual work, follow [design review](design-review.md) before any live write or CoBuild design handoff. Retain the brief with palette hex values and font stacks, working local HTTP URL/server session, rendered preview revision/screenshots, Impeccable recommendations, chosen workflows, and outcomes (or declined/unavailable), explicit user approval or override, and a local render of the actual final editor files confirming parity. Check real font loading/fallbacks and materially distinct pages. Re-render and obtain approval when material visible changes supersede the approved revision. Record unavailable rendering as an unmet gate; do not infer approval from silence.

For multiple pages/long sections, exercise meaningful anchor links, initial/unknown fragments, active navigation, keyboard focus, supported reload/Back/Forward, and intended filter preservation. Validate behavior again inside DSS without changing the host URL. Check the accessibility, analytic semantics, complete states, and difficult-content cases in the design-review reference. These checks add to browser acceptance and do not replace live integration evidence.

## Skill and local checks

When maintaining the skill, run the skill-creator quick validator, check its relative references, and run the skill regression suites. For an app-only edit, validate the changed app files and affected behavior; do not rerun skill-package validation or all unrelated starter tests. Scan generated deliverables for unresolved scaffold values, reference-customer identifiers, exposed credentials, unsafe DOM interpolation, and configuration/schema mismatches. Compile Python; syntax-check JS. For skill maintenance, run `python3 -m unittest discover -s tests -p 'test_*.py'` and `node --test tests/*.test.cjs` from the skill root. Browser smoke tests use Playwright supplied by the environment (`NODE_PATH` may be needed): `node tests/browser.cjs`. Set `QA_SCREENSHOT_DIR` to a scratch/output directory if screenshots are needed; the browser harness creates its own ephemeral local server.

The backend tests use a minimal Flask/Dataiku shim to test contract/history logic, not real Flask routing/authentication. A real DSS integration pass remains required.

## Browser acceptance

- Desktop and narrow layouts render without horizontal page overflow or blocking console errors. Table overflow is contained. Zoom/text growth remains usable.
- Filters, chart selection, row focus, reset, and navigation agree with canonical state. Dates/zoom and ML pages are checked when implemented.
- KPI totals reconcile against every filtered row, even with a display cap. Both record and chart truncation are explicit. Empty/missing-column/error states explain recovery; stale responses never replace newer results.
- Keyboard users can reach controls; focus is visible. Hidden panels are unfocusable, Escape closes the agent drawer, and focus returns to its trigger. Check reduced-motion, contrast, and transparency adaptations. Rapid open/close reversal stays responsive. For implemented direct resizing, test width bounds, center reflow, keyboard resizing, and pointer cancellation/lost capture. Test momentum interruption only for gestures that actually implement momentum.
- Optional agent: all three labels map to their long prompts; context contains only approved fields, filters and bounded evidence; errors allow retry; composer/new-chat/context controls work. Ask a scoped fact with a known expected value and confirm the agent received the intended page, KPI/row evidence, truncation, and selection; a nonempty generic reply is insufficient. Same-user persisted history survives reload and another user cannot access it. Missing identity/folder yields visible session-only behavior. Test in two separately authenticated sessions on DSS; mocks do not prove isolation there.

Capture overview, active filter, narrow layout, and optional drawer/context screenshots. Report every failure, unsupported feature, and check not run.

## Live gates

Verify exact target, protected rollback and permitted diff, environment/packages and execution-mode compatibility, actual iframe fragment routes (including a nontrivial base URL), dataset permissions/counts, backend status/logs when enabled, and production browser data. Agent SDK invocation, verified caller identity, folder permissions, concurrency, and cross-user history need actual integration checks. Never label a fixture pass as production readiness.

For startup or navigation performance work, follow [progressive loading](performance.md). Measure browser time to usable content separately from individual endpoint/server timings, and check both a cold initial visit and navigation after background warming. Do not claim faster first paint from a fast backend response alone.

For optional sources, exercise a schema-present/files-missing condition and verify usable sibling results survive with an explicit availability state. For source edits, verify the installed source matches the tested file; a preflight failure must prevent a candidate/apply. Use @Browser by default for preview and live UI validation. The local Playwright suite is optional regression tooling for skill maintenance and does not replace the persistent user-review preview. Use the permitted browser tool for UI validation; do not run a standalone browser harness when the session restricts browser automation to a different tool. Unit tests and mocks do not establish authenticated live behavior.
