# Product copy and test provenance

Ship a customer interface with concrete task language. Keep the builder's process and test setup outside the product.

## App surface

- Remove test-origin labels such as “synthetic data”, “dummy”, “illustrative”, “demo”, “preview”, “fixture”, “mock”, and “stub” from app headings, banners, badges, assistant replies, accessible labels, tooltips, charts, footers, and downloaded customer output. A term can remain when explicitly requested or part of the actual business workflow (for example a document Preview action); document that exception.
- Remove generic AI marketing (“AI-powered”, “unlock insights”, “seamless experience”), decorative trust/status badges, “Prepared for …”, tutorial filler, and repeated instructions that restate controls. Use the actual task, measure, unit, time period, and next action. A short subtitle is optional; do not fill an empty subtitle with a slogan.
- Never invent “Published evidence”, “Live”, “Verified”, “Production-ready”, “Read only”, “Results are current”, refresh timestamps, model accuracy, or source-health claims. Show exact allowed source names and dynamic counts only when returned by the authorized contract. A successful request proves it completed; freshness needs a source timestamp/version and read-only needs verified tool permissions.
- Preserve useful truth: loading/error/empty states, permission and source outages, truncation and full-scope denominators, missing dates/coverage, causal/model limits, and “Session-only history” when persistence is unavailable. These help a consumer act and are not cosmetic clutter. Context inspection must distinguish a browser proposal from a verified server receipt; simulated receipts cannot be called server verified.
- Replace generic scaffold titles, field names, prompts, and metrics with language grounded in the inspected project. Do not add a logo or identity inferred from an unrelated reference.

## Review harness and delivery records

`body.html`, `style.css`, `app.js`, and optional `backend.py` are canonical editor sources. `preview.html` and `preview-fixture.js` are separate local review files; they never enter DSS tabs. The wrapper discloses local fixture records and simulated assistant replies outside `#standard-app`, with metadata and expandable Review notes. App screenshots can capture the app root; share the review notes/provenance alongside them.

Keep fixture source identifiers, context validation markers, and test switches truthful in test metadata. Preserve the technical preview/fixture terminology in skill instructions and QA reports where it explains what was actually tested. Do not remove provenance from records, silently relabel fixtures as real sources, or describe local test responses as authenticated Dataiku results. After deployment, validate against real authorized sources and report local and live results separately.

## Release check

Run [audit_app_surface.py](../scripts/audit_app_surface.py) on the editor HTML, then inspect rendered visible/accessible text at desktop/narrow widths, chat closed/open, context inspection, and failure/empty states. The static audit checks HTML text/attributes and leaked harness imports; it cannot prove runtime copy quality, data authenticity, or semantics. Review JavaScript/backend strings and actual responses as well. Keep an intentional, documented business-language exception narrow; do not exempt an entire app.
