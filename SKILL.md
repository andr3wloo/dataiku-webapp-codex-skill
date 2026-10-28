---
name: dataiku-standard-webapp
description: Build, patch, deploy, and visually validate native Dataiku Standard WebApps using HTML, CSS, JavaScript, and optional Python backends. Use for Dataiku dashboards, custom interfaces, cross-filtering, optional agent drawers, exact-ID updates, and WebApp QA.
---

# Dataiku Standard WebApp Builder

Deliver a user-approved rendered design and native editor files: HTML, CSS, JavaScript, and Python only when needed. Preserve supplied branding, data contracts, and task scope. Agent features are optional.

## Inspect and route

Inspect supplied code, references, datasets, configured Dataiku-Headless connection, instance version, and target before asking for missing details. Never print credentials. Reuse existing creation/update authorization; clarify ambiguous targets before deployment and never select by recency. Target authorization and design approval are distinct.

Use **Dataiku-Headless first, then the user-selected browser** for uncovered operations and rendered validation, unless the user specifies another route. Honor the browser named in the task or established preferences; if none is known, ask which available browser to use before browser work. Read the installed Headless skill and relevant WebApps/Cobuild guides. This browser fallback overrides their Cobuild-only/stop-on-coverage-gap routing for WebApps while retaining other inspection and validation rules. Do not silently substitute CLI, raw REST, or Python API access. If neither route works, explain the gap and request an alternative.

Read only the references needed for the change:

- [Architecture](references/architecture.md): building or restructuring.
- [Design](references/design.md) and [Impeccable integration](references/impeccable.md): visual or interaction work. Use bundled design guidance; refresh upstream sources only when requested.
- [Design review](references/design-review.md): preview, approval, navigation, and accessibility acceptance.
- [Sidebar assembly](references/paired-sidebars.md): filters or optional chat.
- [Interactions and agents](references/interactions.md): selection, date zoom, cross-filtering, or agents.
- [Progressive loading](references/performance.md): slow startup or immediate multi-page navigation.

## Preview and approve

For new apps or visible changes, follow design review: build and serve a live local interactive preview in the user-selected browser, share its URL/revision and proposed palette/fonts/navigation, and keep it available during review. Obtain explicit approval before design handoff to Headless/Cobuild or live writes. Then render the actual final editor files locally to verify parity. Screenshots supplement the live preview; they do not replace it.

Reuse confirmed choices and approval for the same design. Material visible changes require revised approval; backend-only changes without visible effects do not. If rendering is unavailable, deliver files and report the missing review, keeping visual deployment pending unless the user explicitly overrides the gate.

Recommend optional Impeccable critique and polish as starting points and invite `$impeccable` to recommend suitable workflows. Follow its integration reference, user selection, and existing authorization; reuse prior invocation. If declined or unavailable, continue local review. Reading bundled notes does not execute the plugin.

## Build

Use the no-build [starter](assets/starter/) as canonical editor source, copied into a task-owned directory. Keep one implementation and a separate preview wrapper/fixture adapter; review files never enter DSS. Adapt the starter to the task rather than reconstructing historical outputs. Use its sidebar components when needed; filters and chat are independently optional, and chat defaults off.

- Inspect schemas, volumes, columns, freshness, and permissions. Compute KPIs over the full filtered scope; cap display/evidence payloads and label truncation. Keep substantial ETL, joins, features, training, and reusable aggregation in the Flow; propose missing Flow work separately and execute only when authorized.
- Keep identity, data contract, tokens, and feature settings explicit. Configure the starter's data source before claiming it works. Never copy customer identifiers, data, or prompts from examples.
- Use Dataiku's backend URL helper, input validation, loading/empty/error states, and stale-request protection. Render untrusted text as text; keep privileged APIs, credentials, and agent invocation server-side.
- Maintain canonical interaction state, meaningful page/section anchors, active navigation, and keyboard alternatives. Apps without an agent need no agent ID, drawer, history folder, or agent packages.
- Apply [product copy and provenance](references/product-copy.md). Keep test provenance in the review harness and delivery record; preserve real availability and data/model limitations.
- Treat annotations as acceptance criteria and verify the selected elements locally and after deployment. Follow the focused feedback checklist in design review without broadening unrelated work.

## Deploy, verify, and report

Read [deployment](references/deployment.md) before live changes. Require an authorized project/name for creation or exact project/WebApp ID for updates. Preserve protected rollback sources/settings, confirm STANDARD and source layout, and change only intended fields. Use its safe summary/merge helpers for complete definitions or its browser-only preflight for editor edits. Failed source validation stops the live write; never toggle security, libraries, or backend settings implicitly. Cobuild implementation within an authorized app task needs no separate permission after preview approval.

Follow [QA](references/qa.md): source checks, app-surface audit, meaningful fixture tests, browser acceptance, and applicable live status/log/data/agent checks. Compare the approved preview with the direct exposed WebApp URL at matching viewport/route/filter state; source hashes alone do not prove visual parity. Keep fixture evidence distinct from live integration.

If authenticated access is unavailable, deliver editor files, dependencies, configuration, and paste/setup steps. Lead the report with deployment status or delivered files; include preview revision/approval, colors/fonts, exact targets, checks and limitations, rollback location for updates, and separate Flow proposals. Do not claim completion while required live checks remain unverified.

## Learn from feedback

After completing the task, if positive feedback reveals a reusable principle missing here, propose that specific addition and ask once. Feedback alone does not authorize editing. With approval, generalize it without customer details, update the smallest relevant file, and validate affected references/tests; do not repeat declined or already captured suggestions.
