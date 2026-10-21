# Native Standard WebApp architecture

Authoritative references, checked 2026-10-14:
- https://doc.dataiku.com/dss/latest/webapps/standard.html
- https://developer.dataiku.com/latest/tutorials/webapps/standard/basics/index.html
- https://developer.dataiku.com/latest/api-reference/python/webapps.html
The checked `latest` documentation identifies DSS 15. Inspect the actual instance; do not assume every latest-version feature exists there.

## Editor and runtime

Standard WebApps have separate HTML, CSS, and JavaScript editor tabs, with an optional Python backend. Paste `body.html` as the HTML fragment, raw `style.css` into CSS, and raw `app.js` into JS. Do not include local script/link URLs from `preview.html` in DSS. Enable the Dataiku JavaScript library and explicit dataset read authorizations as needed. For the starter's data-backed mode, enable a Flask backend and paste `backend.py`. DSS provides `app`; do not call `app.run()`, replace it, or embed a development server.

Default to vanilla JavaScript and system fonts. If an existing app uses a framework, preserve it where useful. Add a bundler or external chart/motion dependency only for a concrete need and verify how assets load inside DSS; do not assume internet/CDN access. Flask is the default optional backend; preserve an existing FastAPI backend and its supported route setup rather than converting it unasked.

The starter contains a generic category/value dashboard to demonstrate the mechanics, not a universal business schema. Replace `CONFIG` in JS and `CONFIG` in Python together. Configure allowlisted dataset roles/columns, display/evidence caps, dates, pages, and optional scored outputs. Check a bounded read as well as schema existence: a dataset can have a schema while its backing files are absent. Required missing columns block the affected section with an actionable message; an unavailable optional source must not discard usable sibling results. Distinguish an empty filtered result from an unbuilt/unreadable source. For slow startup, stage the initial view and consider bounded background warming of secondary pages; do not defer every page by default when warm navigation materially improves the consumer experience. Follow [progressive loading](performance.md). Backend caches must be bounded/refreshable and scoped to effective data identity; do not cache user-specific data globally.

## Data and state

Verify complete schemas, storage types, actual row values, and meaningful source volumes before adapting the UI. A missing row-count metric is unknown, not zero. Preserve missing rates and explicitly reject invalid date sentinels rather than coercing them into a valid epoch date. Normalize source-specific key encodings for display/lookups only after inspecting their actual forms.

For the starter backend, configure a published dataset with `category` (text) and `value` (numeric). It computes sum/count over every filtered row, then limits returned records. It uses bounded chart categories with explicit truncation metadata. Adapt contracts to real data volumes: do not load arbitrarily large datasets into pandas; publish aggregates or use approved query/pagination APIs without silently sampling KPI denominators.

Keep joins and reusable transformations in the Flow. Frontend state owns navigation, filter scope, selected item, and date range; changing pages preserves intended filters. A reducer accepts sidebar/chart/table/date/reset events, validates keys/catalog values, and deduplicates tokens. Abort obsolete requests and ignore late responses, even if a server ignores cancellation. Do not keep showing old KPI values beneath a newly selected filter when loading or after failure.

Server responses include `total_rows`, `shown_rows`, `truncated`, `records`, full-scope `kpis`, and full-scope chart aggregates plus `chart_truncated`. Compute all summaries before caps. Only allowlisted source roles, filters, and columns reach the backend. Request-time authorization must reflect the app's intended audience, not merely the backend service account's permissions.

## UI structure

Use task-specific navigation, a compact masthead, explicit scope, KPI/charts/details when relevant, and a collapsible filter area. Optional model pages load scored data on demand. An optional nonmodal agent drawer reflows the desktop layout and overlays on narrow screens. It must have an accessible name, visible close control, correct focus behavior, context inspection, and useful request feedback. Only modal overlays trap focus; hidden panels must not receive focus.

## Optional fragment navigation

For multiple pages/subsections, [navigation.js](../assets/starter/navigation.js) provides an opt-in `StandardWebAppNavigation.bind({pages, defaultPage, onRoute})` helper. The catalog maps page IDs to allowed subsection IDs; the callback owns render/scroll/focus and uses the app's canonical filter state. The helper handles initial fragments, hash changes (including Back/Forward), same-link repeat clicks, and actual local skip-link targets. It never changes the parent DSS document. Include the helper before app initialization in the single raw DSS JS tab; a separate local script URL is not an editor-file dependency.

DSS may supply a `<base href>`: an ordinary `href="#details"` can then navigate the iframe to the host application instead of the WebApp section. The helper intercepts known fragment links using their literal attribute and updates the current document's hash, avoiding base-URL resolution. Test this in a local base-URL harness and again inside the actual DSS iframe. Do not infer shareable host-page deep links from local fragment behavior.

## Local preview

Follow [design review](design-review.md): confirm palette/fonts through an approved rendered preview before CoBuild handoff or live visual changes. Prefer authoring the actual HTML fragment, CSS, and JS from the first preview; inject transport fixtures through a separate local-only adapter. Render those same editor files after integration changes to confirm parity. Preserve previous review artifacts deliberately rather than copying stale screenshots into a new revision. Keep preview-only assets out of the deployed sources.

Copy the starter to a task-owned preview directory, serve that directory, and open its loopback URL in @Browser using the [live preview procedure](design-review.md#serve-a-live-local-preview). Keep it running during user review; do not serve the workspace or rollback directory. It explicitly injects fixture transport and agent stubs. Neither preview fixtures nor stubs are installed in a live WebApp. Production JS defaults to no data configuration and disabled agent. `preview.html` is a developer harness, not a DSS HTML-tab file.
