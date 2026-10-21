# Design agreement, preview, and acceptance

Read for new apps and changes to appearance, layout, navigation, or visible interaction. This is the user's default workflow: confirm design through a rendered preview before Cobuild handoff or live Dataiku changes. Existing target authorization does not constitute approval of an unseen design. Reuse explicit approval already given for the same preview; the user can explicitly override this workflow.

## Make choices reviewable

Inspect supplied branding, screenshots, existing app styles, audience, and main task. Prepare a compact design brief alongside the preview:

- Palette: hex values and roles for brand/accent, background/surface, primary/secondary text, borders/focus, success/warning/error, and chart series. Preserve stable category colors across pages and filters. Encode status with text or symbols as well as color.
- Typography: heading/body/numeric families, actual weights, size hierarchy, line heights, and fallback stacks. Confirm that font files or system faces are available in the intended DSS environment. Show fallback rendering if a proposed custom font is unavailable; approval of the font name alone does not prove it loads. Do not assume Google Fonts or another CDN is reachable. Use tabular numerals for aligned measures.
- Structure: primary decision/action, named pages and anchors, global versus page filters, information density, and behavior at desktop and narrow widths. Show a representative chart/table/detail view when the task includes them.

Propose sensible values when information is missing and label them as proposed. Build the preview before asking for approval so the user can assess the choices together. Ask one focused approval question covering the rendered design and colors/fonts; do not add redundant approval steps for choices already confirmed.

## Render, approve, then adapt

1. Build a working local HTML/CSS/JS preview with realistic, clearly labeled fixtures matching the known schema, units, and content lengths. Use authorized data only; keep credentials out. Keep fixture transport separate from production. Read-only inspection of Dataiku may happen during preparation.
2. Serve the preview over loopback HTTP and open its live URL in @Browser (see below). Keep the server available while the user reviews it. Open the preview in the browser and inspect actual rendering and core interactions. An HTML file, wireframe, generated illustration, or unrendered source is insufficient. Show the user the interactive preview plus screenshots of the main desktop view and narrow layout; cover materially distinct pages and a relevant nonideal state. Record a local revision identifier and the source files it represents.
3. Recommend Impeccable critique and polish as starting points, and invite the user to trigger `$impeccable` against this URL/revision for its context-specific recommendations, following [Impeccable integration](impeccable.md). Let Impeccable route the work rather than enforcing a fixed sequence. Apply authorized recommendations locally and refresh the preview revision before approval. Request explicit approval of that revision, palette, fonts, navigation, and layout. While approval is pending, continue independent read-only inspection or preparation. Do not send the design to CoBuild or change the live WebApp. Time elapsed, silence, or a generic earlier request to build an app is not preview approval.
4. After approval, adapt the design to native Standard files: HTML fragment, raw CSS, raw JS, optional Python. The prototype may already use that structure; avoid a gratuitous rewrite. When using CoBuild, pass the approved design, tokens, screenshots, page map, and data contract as its acceptance reference. CoBuild is a supported implementation route within the already authorized app task; using it requires no separate permission.
5. Render a local wrapper loading the actual final editor files, with only the data transport mocked. Recheck colors, loaded/fallback fonts, page anchors, layout, and interactions against the approved preview. Fix drift before a live write; do not rely on screenshots of an earlier prototype. Material visible revisions need a fresh preview and approval; faithful adaptation and invisible implementation fixes reuse the existing approval.
6. Deploy within the authorized target, then inspect the rendered app in DSS. If iframe sizing, asset loading, host CSS, or routing changes the result, fix within the approved design and validate again. Report live integration separately from fixture-based preview evidence.

For visual updates to existing apps, capture the current view and preview the proposed change before applying it. Reuse the current confirmed palette/fonts unless the requested change affects them. If rendering is unavailable, provide source and the review limitation, leaving visual deployment pending unless the user explicitly overrides the gate. Backend-only work without a visible effect does not require a design approval cycle.

## Serve a live local preview

Copy/adapt the starter into a task-owned directory; do not edit the installed skill assets for an app. From the task workspace, start a persistent terminal process, for example:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory work/webapp-preview
```

Use a free port if occupied; never terminate an unrelated server. Serve only the preview directory, keeping credentials, raw definitions, and rollback files outside it. Open `http://127.0.0.1:8765/preview.html` in @Browser and verify a successful load and functioning controls. Share that clickable URL and the preview revision with the user. Keep the terminal/server alive across the approval pause; record its session and directory so it can be resumed. Preserve the preview tab across turns with the browser’s handoff/persistence feature when available so the user can inspect it after the turn ends. Refresh/recheck the same URL after edits and identify the new revision. Stop the server when review/integration is complete or the user requests it. A short-lived test harness that exits after screenshots is not the user's live preview.

The wrapper must load the canonical editor files with only transport/fixtures mocked. `file://` cannot reliably load the fetched HTML fragment. If @Browser cannot reach loopback, diagnose the route; explain the blocker and leave deployment pending rather than calling a screenshot or an unopened URL a live preview. Use a different preview mechanism only when the user instructs it.

## Page and section anchors

- Use meaningful, stable IDs and real links such as `href="#overview"` and `href="#partner-details"`. In a long page these target actual section IDs; in a multi-view app they resolve through the canonical page state and reveal the relevant view. Keep the page catalog, links, selected state, and heading synchronized.
- Identify navigation with a labeled `nav` landmark and the active destination with `aria-current="page"` or `"location"` as appropriate. Provide a skip link to main content and a heading hierarchy. Route changes move focus to the destination heading/main region; scroll-based active-section updates should not steal focus. Offset anchored scrolling below sticky headers.
- Handle initial fragments, supported reload/deep links, Back/Forward, and unknown anchors safely. Allowlist page/section IDs. Retain intended global filters across views and label page-specific scope. Keep sensitive filters, records, and prompts out of URL fragments.
- Manage only the WebApp document's location/history, never the DSS host URL or parent frame. Verify fragment/history behavior in the actual iframe; if DSS does not preserve standalone deep links, keep in-app anchors working and report that limitation. Do not promise shareable DSS page URLs based on local preview alone.

## Additional design acceptance checks

- **Measurable access:** use semantic controls and labels, visible unobscured focus, keyboard alternatives for chart selections, and text/table alternatives for important charts. Target WCAG 2.2 AA: normal text contrast at least 4.5:1, large text 3:1, and required control/graphic boundaries 3:1. Check control targets against the 24-by-24 CSS pixel minimum or its spacing/exceptions; prefer larger comfortable targets where practical. Check 200% text resizing and reflow at 320 CSS pixels, with necessary two-dimensional tables/charts contained in their own scroll region. These checks do not by themselves establish full conformance.
- **Truthful analytics:** name metric units, currency, time period/timezone, denominator, comparison baseline, and data freshness where relevant. Distinguish zero, missing, and unavailable. Keep chart categories/colors stable, use a zero baseline for magnitude bars, and clearly label unusual scales. Give tables visible sort direction, stable row identity, and access to truncated text. Do not make every KPI a competing accent color.
- **Complete states:** preview loading, no data, filtered-empty, partial/truncated data, permission failures, and retryable errors as relevant. Preserve filter inputs, reserve space to reduce layout jumps, and prevent stale values from appearing under a new scope. Announce meaningful asynchronous status changes without moving focus.
- **Layout and component consistency:** centralize tokens for spacing, radii, shadows, type, colors, and content widths. Reuse button/filter/card/table patterns across pages. Test long labels, large/negative values, many categories, dense rows, narrow iframe widths, and font fallback. Check sticky headers, drawers, dropdowns, and tooltips for clipping, overlap, and hidden focus; hover-only content needs keyboard/touch access.
- **Operational fit:** verify fonts, icons, charts, and dependencies with the target's asset/security restrictions. Preview realistic data volume and slow responses. Keep heavy aggregation in the Flow, lazy-load secondary views, and preserve keyboard focus during rerenders. Optional motion must honor reduced-motion preferences.

Accessibility reference: [W3C WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/), consulted 2026-10-15. This is attribution for the local acceptance criteria; routine use does not require refetching it.

## Compact chrome and sticky subsection navigation

Keep instructional/development commentary in the review brief, not scattered through the operational UI. Use a compact scope indicator and actionable data-quality states. Fixtures still need a truthful local preview label; a requested removal of a large banner can use a smaller indicator without passing fixtures off as live data.

When subsection navigation is sticky, give it an opaque full-width surface aligned to the actual scroll pane, including its padding. Check the top and side gaps while a chart scrolls under the bar; a solid background on only the text's content box is insufficient. Account for the bar's rendered height and pane padding when scrolling to targets, preserve keyboard focus, and disable animated jumps under reduced motion. If scrollbars are hidden by design, preserve wheel/touch/keyboard scrolling and a keyboard-focusable scroll region. Use a small centered vector icon for compact icon buttons rather than relying on a font glyph's baseline.
