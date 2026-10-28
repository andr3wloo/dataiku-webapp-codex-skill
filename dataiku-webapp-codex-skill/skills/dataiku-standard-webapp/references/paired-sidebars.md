# Filter and agent sidebars in the canonical starter

The [starter](../assets/starter/) owns the current instrument-panel shell, matched filter/chat sidebars, controller, and optional backend. Use these components for dashboards that need filtering or chat. Preserve customer branding; adapt the composition when another interface is better. There is no separate editable paired-sidebar implementation.

## Files and configuration

Run [assemble_sidebar_template.py](../scripts/assemble_sidebar_template.py) with `--output NEW_DIRECTORY`. It copies `body.html`, `style.css`, `app.js`, `backend.py`, `preview.html`, and `preview-fixture.js` from the canonical starter and refuses to overwrite a candidate. Only the first three files plus an intentionally configured optional backend belong in DSS.

- HTML tab: [body.html](../assets/starter/body.html), an HTML fragment.
- CSS tab: [style.css](../assets/starter/style.css), raw CSS. Current default tokens are masthead `#122b39`, accent `#155d76`, canvas `#eaf0f3`, text `#172d3a`, and secondary text `#425b69`, with system fonts. Preserve or confirm customer branding.
- JS tab: [app.js](../assets/starter/app.js), one self-contained file with `CONFIG`, panel layout, and data/chat controller. No concatenation or separate panel script is needed. Set title, page heading, optional concise subtitle, data columns, caps, and feature settings here.
- Python tab: adapt [backend.py](../assets/starter/backend.py) to authorized sources and the verified agent SDK. Omit Python for a static app. Agent identity, SDK invocation, and storage adapters follow [interactions](interactions.md).
- Review: serve the assembled directory and open `preview.html` in the user-selected browser using [design review](design-review.md#serve-a-live-local-preview). The compatibility entrypoint [paired-sidebars/preview.html](../assets/paired-sidebars/preview.html) loads those same starter sources through relative URLs. Its [desktop](../assets/paired-sidebars/desktop.png) and [narrow](../assets/paired-sidebars/narrow-agent.png) screenshots are reference images, never alternate source files. Regenerate them after a visual revision.

`filters.enabled` defaults to true. Set it false to hide the left panel and its trigger without reserving a column. Chart/row selection still has a contextual Reset scope control in the heading when the filter panel is disabled. `agent.enabled` defaults to false: no chat UI, history calls, agent ID, or history folder is needed. Both flags are independent. Panel width constraints and `agentInitiallyOpen` live under `panels`; narrow screens start with both panels closed and allow one modal panel at a time.

## Interaction and customization contract

Replace generic titles/metric labels/columns/questions with task-specific language. Do not carry customer identifiers or reference prompts into another app. Add filter groups only when backed by canonical state, validated option catalogs, backend filtering, reset, and context reconstruction; the runnable starter implements one category filter.

The desktop panels share header/control styles. Pointer capture and keyboard arrows (Shift for larger steps), Home/End, min/max bounds, and center-width protection govern resizing. Filters and drafts survive collapse. Persistent toolbar controls reopen panels. Narrow layouts use a scrim, Escape, focus containment/return, and inert hidden/background content. Desktop panels are nonmodal. Direct resizing does not need springs or momentum.

`agent.starterMode: 'draft'` fills the composer without submitting; this is also the fallback when omitted. Send or Enter submits; Shift+Enter inserts a line break. Set `'send'` only for explicitly requested immediate submission. Keep exactly three `{label,prompt}` mappings when chat is enabled. The plus control starts a new chat and does not upload files.

The shell uses a deep masthead, inline SVG controls, a compact scope chip, one grouped summary strip, and proportional chart rows. Signed values retain an accurate zero baseline. Status and source text must be backed by the data response, never a decorative “Published evidence” claim. Follow [product copy](product-copy.md): review-only provenance remains outside the app root. Keep authored motion interruptible and honor reduced motion.

## Context verification

The inspector keeps current proposed browser context separate from the last submitted context. Each submission captures scope, selection, capped evidence with totals/truncation, source roles, and full-scope KPI/chart summaries. The backend recomputes authorized context, passes that object to the adapter, and returns `context_receipt` with `validation: 'server_recomputed'`. Display that receipt rather than a later browser scope. Test receipts remain explicitly unverified; a receipt proves adapter input, while actual model grounding requires a scoped factual live test.

Do not trust client source IDs, identity, agent IDs, or evidence. Session-only history remains visible unless identity, storage, overwrite, and concurrency guarantees are verified. The [agent contract](interactions.md) is authoritative.

## Acceptance

Test both feature flags independently and together, no reserved space for disabled panels, collapse/reopen, draft/filter preservation, keyboard/pointer resize, narrow focus/Escape, reduced motion, and interrupted interactions. Reconcile filter/reset/chart/row state with full-scope KPIs and submitted context. Test all three draft starters, explicit immediate-send mode, missing-column/error/empty states, stale data requests, failed answers, and scope changes during a pending answer. A fixture pass does not verify authenticated DSS or history isolation.
