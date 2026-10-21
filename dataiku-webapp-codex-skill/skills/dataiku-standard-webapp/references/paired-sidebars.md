# Paired filter and agent sidebars

Use this opt-in preset when a user requests a filter sidebar and an agent chat sidebar, or asks to replicate the matched sidebar UI. It frames an evidence-first dashboard with matched white panels, compact inward collapse controls, filter groups/reset on the left, and three prompts/context/thread/composer on the right. The industrial instrument-panel treatment is its current reusable visual direction; preserve customer branding when adapting it. This preset does not become the default for unrelated apps.

## Files and integration

Use [assemble_sidebar_template.py](../scripts/assemble_sidebar_template.py) with `--output NEW_DIRECTORY` to produce the four editor-ready files below plus a self-contained fixture preview (`preview.html` and `preview-fixture.js`). The helper refuses to overwrite an existing candidate. Alternatively copy/concatenate the sources directly. A validated [desktop fixture screenshot](../assets/paired-sidebars/desktop.jpg) and [narrow chat screenshot](../assets/paired-sidebars/narrow-agent.jpg) show the intended shell.

- HTML tab: [body.html](../assets/paired-sidebars/body.html).
- CSS tab: [style.css](../assets/paired-sidebars/style.css). Configure the customer tokens at the top. The generic instrument-panel palette uses ink `#122b39`, accent `#155d76`, canvas `#eaf0f3`, text `#172d3a`, secondary text `#425b69`, and a restrained amber source marker `#eeb449`, with a system font stack. These colors are a portable starting point, not a substitute for preserving or confirming the new customer's brand.
- JS tab: concatenate [config.js](../assets/paired-sidebars/config.js), [panels.js](../assets/paired-sidebars/panels.js), then the shared [starter app.js](../assets/starter/app.js), in that order. These are raw source files; do not paste local script URLs into DSS. A single shared controller/backend avoids drift between presets.
- Python tab: adapt [starter backend.py](../assets/starter/backend.py) to authorized data and the verified agent SDK. Set agent ID server-side and register the adapter as described in [interactions](interactions.md). Real persistence still needs verified caller identity and storage adapters.
- Local preview: serve the assembled output directory and open its `preview.html` in @Browser, following the [live preview procedure](design-review.md#serve-a-live-local-preview). This loads the actual assembled editor sources. To inspect the unmodified preset itself, serve the skill's `assets/` directory and open `paired-sidebars/preview.html`. [preview.html](../assets/paired-sidebars/preview.html) uses clearly labeled synthetic data and an agent stub. It is not a deployed Dataiku app. Production configuration deliberately starts with data and agent disabled.

## Customization contract

Keep the editor sources canonical. Change title, user-facing agent name, exactly three `{label,prompt}` starter mappings, evidence allowlist/caps, dataset columns, and brand tokens for each app. Add filter groups only when backed by canonical state, validated catalogs, backend filters, reset, and context reconstruction; the runnable generic preset demonstrates one category filter rather than pretending to support arbitrary schemas.

`panels` config controls initial widths, usable center width, responsive breakpoint, and optional initial desktop chat. Both panels use matching surface/header/control styles. Desktop resizing uses pointer capture plus keyboard arrows (Shift for larger steps), Home/End, minimum/maximum widths, and center-width protection. Filters and chat drafts survive collapse. Persistent toolbar controls reopen them. Narrow screens show one modal panel at a time with scrim, Escape, focus containment/return, and hidden panels inert; desktop panels remain nonmodal.

`agent.starterMode: 'draft'` fills the composer, allowing edits before Send or Enter; Shift+Enter inserts a line break. Set `'send'` only when the user wants starter clicks to submit immediately. The prompt is distinct from its short button label. Do not attach file-upload behavior to the plus icon: it explicitly starts a new chat.

The instrument-panel treatment uses a deep control-room masthead, compact source label, drawn inline SVG controls, a clearly named scope chip, one grouped summary strip, and proportional category rows. Keep status text visible alongside its color marker. Animate changing bar fills with transforms; keep layout changes immediate and make all authored motion yield to `prefers-reduced-motion`. The local preview screenshots show the desktop and narrow chat compositions; update them when the template's visual revision changes.

## Verify context rather than infer it

The inspector shows current proposed browser context and preserves the last submitted context separately. Each submission captures its filter scope, selection, capped evidence with totals/truncation, source roles, and full-scope KPI/chart summaries. The backend recomputes the authorized context, passes that same object to the agent adapter, and returns it as `context_receipt` with `validation: 'server_recomputed'`. Show that receipt, not a live browser context that may have changed while the answer was loading. A fixture receipt is labeled `fixture_only`; an older backend without a receipt is shown as unverified.

Never trust client context, source IDs, identity, or agent IDs. The receipt proves which server object reached the adapter, not that the actual agent model used it. In DSS, separately ask a scoped factual question with a known answer and verify model-visible context as described in [interactions](interactions.md). Session-only history must remain visible when persistence is not verified.

## Acceptance

Exercise both panels together, each collapse/reopen, draft/filter preservation, pointer and keyboard resizing, viewport shrink, narrow modal focus, Escape, and reduced motion. Test filter/reset and row selection against results and submitted context. Verify all three draft and immediate-send modes, long/failed/empty answers, pending submission under a subsequent filter change, and a context receipt with server-corrected evidence rather than browser-forged values. Use a rendered fixture preview and the existing approval workflow before any future live design deployment.
