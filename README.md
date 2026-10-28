# Dataiku Standard WebApp Skill for Codex

Build, update, and validate native Dataiku Standard WebApps with HTML, CSS, JavaScript, and an optional Python backend. This reusable skill includes design guidance, a configurable starter, local preview fixtures, deployment helpers, and regression tests.

This repository is the `dataiku-standard-webapp` skill. `SKILL.md` is at the root alongside its references, scripts, assets, tests, and UI metadata.

## Install with Codex

Paste this into Codex after the update is merged into `main`:

```text
Use $skill-installer to install this skill from:
https://github.com/andr3wloo/dataiku-webapp-codex-skill/tree/main
```

The skill installer refuses to overwrite an existing installation. To upgrade, first back up the installed `dataiku-standard-webapp` folder outside your active skills directory, then remove that installation and install the new version. Preserve any personal changes you want to reapply.

The installed skill is available on your next turn. Invoke `$dataiku-standard-webapp` explicitly for the first task.

## Manual installation

Download and extract this repository. From its extracted root, copy the entire extracted repository contents into a folder named `dataiku-standard-webapp` in your Codex skills directory:

- Default: `~/.codex/skills/dataiku-standard-webapp`
- Custom Codex home: `$CODEX_HOME/skills/dataiku-standard-webapp`

The destination must contain `SKILL.md` directly, alongside `agents/`, `assets/`, `references/`, `scripts/`, and `tests/`. Avoid an extra nested skill folder. Back up an existing installation before replacing it; replace the complete folder so obsolete files do not remain.

## What you need

- Codex with access to local files and a terminal for assembling and serving previews.
- Python 3 for the included helpers and local HTTP preview. Node.js is needed for JavaScript validation by the definition merger and for JavaScript regression tests.
- For connected Dataiku work: a configured Dataiku-Headless connection and/or an authenticated browser session permitted for the target instance. The default route uses Dataiku-Headless first, then the user-selected browser for uncovered operations and rendered validation. Explicitly name your preferred browser in the request.
- For a Python-backed WebApp: a verified DSS environment with Dataiku, pandas, and Flask available. Static apps do not need a Python backend.
- Impeccable is optional. Bundled design guidance remains usable without it. Agent invocation and durable chat history require additional configuration only when those features are requested.

No credentials, customer connection settings, or personal filesystem paths are supplied by this package. Configure access in your own environment. Without authenticated Dataiku access, the skill can deliver local previews, editor files, and manual setup instructions; live deployment remains unverified.

## Start a task

For a new app:

```text
Use $dataiku-standard-webapp to build a dashboard for [business task].
Use [browser name] for previews and browser fallback.
Target project: [project key]. App name: [name].
Datasets: [names and relevant columns]. Branding: [reference or requirements].
Prepare a local interactive preview for my approval before deployment.
Keep the agent disabled unless I request it.
```

For an existing app:

```text
Use $dataiku-standard-webapp to update project [project key], WebApp [exact ID].
Change [specific behavior]. Use [browser name].
Preserve other sources and settings. Show visible changes locally for approval first.
```

The workflow inspects the target and data contract, prepares a live local preview, obtains design approval, renders the final editor files, and then deploys within the authorized scope. Material visible revisions require renewed approval. Backend-only fixes without visible changes reuse the applicable authorization.

## Preview the starter locally

Run from the repository root, choosing a new output directory:

```sh
python3 scripts/assemble_sidebar_template.py --output work/webapp-preview
python3 -m http.server 8765 --bind 127.0.0.1 --directory work/webapp-preview
```

Open [the starter preview](http://127.0.0.1:8765/preview.html) in your selected browser. Keep the server running during review; choose another port if occupied. The wrapper discloses fixture data separately from the app. It demonstrates the interface and does not prove a live DSS connection.

The native editor sources are `body.html`, `style.css`, `app.js`, and optional `backend.py`. Never paste `preview.html` or `preview-fixture.js` into DSS. Configure the data source and required columns; the production starter intentionally reports setup required until configured. Filters and agent chat are independent features; chat defaults off.

## Validate changes

From the repository root:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.cjs
python3 scripts/audit_app_surface.py --html assets/starter/body.html
```

The optional browser smoke suite is `node tests/browser.cjs` and requires Playwright with a browser runtime. Use it only where permitted by your environment's browser tooling rules. The Codex skill-creator validator separately requires PyYAML. Unit tests, fixture previews, and static audits do not establish live DSS permissions, agent grounding, or cross-user history isolation; follow the bundled QA guide for deployment acceptance.

## Package contents

- `SKILL.md`: concise routing, approval, build, deployment, and reporting workflow.
- `assets/starter/`: canonical editor sources and separate fixture preview.
- `assets/paired-sidebars/`: linked review entrypoint and reference screenshots.
- `references/`: design, interactions, deployment, provenance, performance, and QA guidance.
- `scripts/`: starter assembly, safe definition inspection/merge, and app-surface audit.
- `tests/`: Python and JavaScript regression checks plus optional browser smoke tests.
- `agents/openai.yaml`: Codex UI metadata.
- `THIRD-PARTY-NOTICES.md`: attribution and applicable third-party license text.

Review the exact project/WebApp target before live changes. Keep credentials and raw rollback definitions out of the repository and outside preview server directories.
