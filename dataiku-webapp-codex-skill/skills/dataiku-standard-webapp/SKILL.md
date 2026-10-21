---
name: dataiku-standard-webapp
description: Build, patch, deploy, and visually validate native Dataiku Standard WebApps using HTML, CSS, JavaScript, and optional Python backends. Use for Dataiku dashboards, custom interfaces, cross-filtering, optional agent drawers, exact-ID updates, and WebApp QA. Streamlit requests belong to dataiku-webapp-qa.
---

# Dataiku Standard WebApp Builder

Deliver a user-approved rendered design, then editor-ready HTML, CSS, JavaScript, and Python only when needed. Build for the user's task and branding, with clear hierarchy and responsive, accessible interactions. Agent features are optional.

## Ground and route

Inspect supplied code, references, data contracts, configured Dataiku Headless connection, instance version, and target before asking for missing details. Do not read or print credentials. Reuse existing authorization: an exact update ID or a clearly requested creation needs no repeated create/update question. Target authorization and design approval are distinct; apply the preview gate below for visual work. If the target is ambiguous, clarify before deployment; never choose by recency.

Use **Dataiku Headless (plugin) first, then @Browser** for Dataiku access unless the user instructs an alternative. Use Headless for supported inspection and post-approval Cobuild work; use @Browser for uncovered editor/settings operations and rendered validation. Read the installed Headless skill and its WebApps/Cobuild guides when using it. This skill’s user-selected @Browser fallback overrides the Headless guide’s Cobuild-only/stop-on-coverage-gap routing for WebApp operations; keep its other inspection and validation rules. Authorized app creation/update includes using Cobuild as an implementation route after preview approval; no separate permission to use that route is needed. Do not silently substitute a CLI, raw REST, Python API unless specifically directed. If neither default route can complete an operation, explain the specific gap and ask for an alternative. 

Read [architecture](references/architecture.md) when building or restructuring and [design](references/design.md) before visual or interaction work. The local design reference includes the detailed Apple-derived principles, formulas, examples, and accessibility guidance. Use it without fetching upstream design links; those links are attribution only. Refresh design sources only when the user explicitly asks. Use the vanilla, no-build [starter](assets/starter/) as a base, adapting its structure to the use case rather than forcing dashboard pages onto every app. For slow startup or a multi-page app where immediate navigation matters, also read [progressive loading](references/performance.md).

## Confirm the design before integration

For frontend design, critique, polish, typography/layout, responsive adaptation, or UI hardening, read the local [Impeccable integration](references/impeccable.md). Its default mode for dashboards is Operate: task clarity, consistent controls, readable data, and restrained expression. Recommend **Impeccable critique and polish as useful starting points**, and invite the user to trigger `$impeccable` to assess the current app or preview and recommend the most useful next steps. These are suggestions, not a required pair, order, or limit on its capabilities. Let the installed Impeccable skill route the request and recommend appropriate workflows; follow the user’s selection or existing authorization within the app task. Reuse an invocation already given; do not require a new trigger for each already authorized step. Give it the preview URL/revision and relevant sources. Continue independent preview preparation while awaiting the trigger; do not claim that reading the local notes executed Impeccable. If unavailable or declined, report that and continue with the local review and preview gate. Do not install tooling, enable hooks, or replace an approved design as a side effect. Backend-only work does not need this design route.

For new apps and changes to appearance, layout, navigation, or visible interaction, read [design review](references/design-review.md). Confirm colors and fonts through a concrete design brief and browser-rendered preview. Propose missing choices using available branding; show palette hex values, semantic roles, font families/weights/fallbacks, and page navigation. Reuse choices already confirmed in this conversation.

Build, serve on a loopback HTTP URL, and open a live local interactive preview in @Browser before sending design work to Dataiku Headless, Cobuild, or creating/updating the live Dataiku WebApp. Share the working URL and revision, keep the preview server running during review, and get explicit user approval of that preview and its colors/fonts. After approval, adapt the design to native Standard editor files and render those files locally to check parity. Only then create/update the app in Dataiku within the authorized target. Reuse approval for the same design; material visible changes require a revised preview and approval. A backend-only fix with no visible change does not need a new design approval. Screenshots and source files supplement the live URL; they do not replace it. Follow the serving procedure in [design review](references/design-review.md). If rendering is unavailable, deliver the files and explain the missing review; keep visual deployment pending. An explicit user override can change this gate.

## Apply annotation-led design feedback
Treat each browser annotation or selected element as an acceptance criterion. Translate comments into a short checklist, then verify those exact elements in the rendered preview and deployed app.

For production-facing WebApps:
- Preserve the company identity supplied by the project/source. Do not substitute a customer's brand based on audience or add personalizing copy such as “Prepared for …” unless requested.
- Keep the hero description to one concise sentence. Remove filler, repeated explanations, and commentary that restates visible controls.
- Show the accurate source dataset and a dynamic record count. Avoid vague header badges such as “Partial” when they do not explain what is affected; put precise, actionable source/model status beside the affected view.
- Avoid generic “synthetic”, “dummy”, or “illustrative” labels in the task-facing interface. Keep any required fixture disclosure in the local preview harness or demo documentation, and never present fixture values as verified production results. Preserve concise, relevant caveats about validation or causal limits.
- When an assistant is present, provide a few task-specific sample questions. Selecting one should populate the composer without submitting it; browser QA must not invoke a live agent unless the user asks.
- Tighten excess whitespace modestly while preserving readable grouping and touch targets.

Keep this checklist tied to the user's feedback, not as a reason to broaden an unrelated change.

## Build

Keep one canonical set of editor files and a separate preview wrapper/fixture adapter, so design revisions and integration fixes do not require rewriting the same app. Read only the references needed for the current change. Reuse confirmed branding and approval within their stated scope.

When the user asks for a filter sidebar plus agent chat, use the opt-in [paired-sidebars template](references/paired-sidebars.md). It reproduces the matched collapsible/resizable filter and chat panels, reset scope, three configurable query starters, composer, and context inspection without carrying customer branding or identifiers. It is a template asset, not authorization to create another live WebApp.

- Inspect published datasets, schemas, row volumes, required columns, refresh expectations, and permissions. Calculate KPIs over the full filtered scope; cap display/evidence payloads and label truncation. Keep ETL, joins, feature engineering, training, and substantial reusable aggregation in the Flow. Propose missing Flow work separately; execute only when authorized.
- Keep identity, data contract, UI tokens, and feature settings obvious. The starter deliberately fails with a setup message until a data source is configured. Its separate preview uses labeled fixture data only.
- Use Dataiku's backend URL helper, validated request inputs, explicit loading/empty/error states, and stale-request protection. Render untrusted text as text. Privileged APIs, credentials, and agent invocation stay server-side.
- Use one canonical interaction state. For multiple pages or long dashboard sections, add stable, meaningful page/section anchors with active navigation and keyboard access; see [design review](references/design-review.md). Read [interactions and agents](references/interactions.md) for selection, date zoom, cross-filtering, or an agent. No agent ID, drawer, history folder, or agent packages are required for an app without that feature.
- Honor customer branding and reference intent; never transplant customer data, identifiers, or prompts from examples. Keep gestures purposeful and offer keyboard alternatives.

## Deploy or hand off

Read [deployment](references/deployment.md) before any live change. For visual changes, confirm preview approval and render the final editor files before applying them. Require an authorized project/name for creation or exact project/WebApp ID for an update. Preserve the full fetched definition in protected rollback storage, inspect it with [the safe summary helper](scripts/inspect_standard_definition.py), verify type STANDARD and source paths, and use [the merger](scripts/merge_standard_definition.py) when the selected route provides a complete round-trippable definition. For browser-only source edits, preserve all current tabs/settings and replace only intended tabs; see the equivalent preflight in deployment. A failed source check must stop the live write; the merger validates supplied Python and JavaScript before producing a candidate. Do not rebuild settings or toggle security/library/backend settings implicitly.

If authenticated access is unavailable, return the editor files, data/optional-agent configuration checklist, packages, and paste/setup steps. Do not claim the app was deployed.

## Learn from user feedback

When the user gives clear positive feedback on a delivered design, interaction, or workflow, check whether it expresses a reusable principle that is missing from this skill. Once the active task is complete, take the initiative to ask whether they want that specific principle added to the skill; phrase the proposed learning concretely and briefly. Positive feedback is not itself permission to edit. If the user agrees, generalize the principle, omit customer-specific identifiers or data, update the smallest relevant skill file, and validate the affected references and tests. Do not ask again about the same feedback if the principle is already captured or the user declines.

## Verify and report

Follow [QA](references/qa.md). Run source checks, meaningful fixture tests, and browser QA; for live work also check status, logs, dataset access, and optional agent/history behavior. For visual parity, compare the local preview with the direct exposed WebApp URL (`/webapps/<project>/<id>`) at the same viewport, route, and filter state where possible. The editor's `/view` page adds Dataiku chrome and side panels, so it is not a reliable canvas for judging the app alone. Matching source hashes is necessary but not visual proof; confirm the rendered screenshots and distinguish data-content differences from layout differences. A local fixture preview is not live integration evidence.

Lead with deployment status or delivered files. Include the preview artifact/version and approval status, confirmed colors/fonts, exact targets used, checks passed/failed/not run, limitations, rollback location for updates, and separately proposed Flow changes. Do not call deployment complete while required live checks remain unverified.
