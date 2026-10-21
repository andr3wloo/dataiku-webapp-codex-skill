# Dataiku WebApp Builder plugin

This Codex plugin packages the `dataiku-standard-webapp` skill and its supporting files.

## Contents

- `plugin.json`: portable plugin manifest
- `skills/dataiku-standard-webapp/`: complete skill, including its `SKILL.md`, references, scripts, assets, agent metadata, and tests

## Install from GitHub in Codex

After this repository and its `.agents/plugins/marketplace.json` file are pushed to GitHub:

1. Run `codex plugin marketplace add andr3wloo/dataiku-webapp-codex-skill`.
2. Restart the Codex desktop app.
3. Open the Plugins Directory, select **Dataiku WebApp Skills**, and install **Dataiku WebApp Builder**.
4. Use `$dataiku-standard-webapp` in Codex, or ask for a matching Dataiku Standard WebApp task.

This plugin contains workflow instructions and local starter resources. Users still need the Dataiku Headless and browser capabilities expected by the skill.
