# Workflow Config

Workflow definitions are local JSON files under `config/workflows`. The CLI loads this directory by default and validates each file before use. Set `AGENT_WORKFLOWS_CONFIG_DIR` to test another directory.

## Required Fields

Each workflow config must include:

- `id`: stable lowercase workflow id used by the CLI.
- `version`: semantic workflow config version, for example `1.0.0`.
- `title`, `description`, `inputHint`: user-facing metadata.
- `specialists`: existing specialist agent keys only.
- `tasks`: ordered task list with `id`, `title`, `agent`, `objective`, and optional `parallelGroup`.
- `managerPrompt`: final synthesis instruction.
- `requiredSections`: Markdown sections enforced by the reviewer.
- `approvalPolicy`: human approval reminders added to reports.

Task `agent` values must be listed in `specialists`, and every agent key must already exist in `src/agents/definitions.ts`.

Every trace records the workflow `version` plus a short SHA-256 hash of the raw config JSON. Increment `version` when a config change is intended to affect output behavior; the hash still captures smaller edits exactly.

## Add A Workflow

1. Fill out `templates/evaluation/workflow-idea.md` and compare the idea against `docs/roadmap.md`.
2. Add `config/workflows/<workflow-id>.json`.
3. Run `npm run config:check`.
4. Add or update an input template under `templates/inputs`.
5. Add focused registry, schema, or reviewer tests when behavior changes.
6. Run `npm run workflow:mock -- <workflow-id> <input-file>`, `npm run typecheck`, `npm test`, and `npm run build`.

When comparing two config or prompt variants, run the same input twice and use:

```bash
npm run compare -- runs/traces/<base-run-id>.json runs/traces/<candidate-run-id>.json
```

Keep workflows file-based until evaluations show repeated use and clear time savings. Do not add Gmail, Calendar, Notion, publishing, git, deploy, PR, or other external side effects.
