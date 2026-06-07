# Multi Agents

CLI-first multi-agent workflows for work operations. The MVP takes local files as input, runs specialist agents, passes outputs through review, and saves Markdown reports plus JSON trace summaries.

## Install

```bash
npm install
cp .env.example .env
```

Set `OPENAI_API_KEY` in `.env`. Override `OPENAI_MODEL` when needed.

## Run

Start with a template when using real work material:

```bash
npm run templates
npm run config:check
```

```bash
npm run workflow -- research-report examples/inputs/research-report.md
npm run workflow -- ops-weekly examples/inputs/weekly.md
npm run workflow -- meeting-actions examples/inputs/meeting.md
npm run workflow -- content-ops examples/inputs/content.md
```

For a no-key local preview:

```bash
npm run workflow:mock -- research-report examples/inputs/research-report.md
```

Each run writes:

- `runs/reports/<run-id>.md`
- `runs/traces/<run-id>.json`

Record whether a run helped:

```bash
npm run evaluate -- runs/traces/<run-id>.json --before-min 90 --after-min 35 --adopted partial --error "missed owner" --rework "clarify metric source"
npm run review -- --out runs
```

Evaluation records are written to:

- `runs/evaluations/<run-id>.json`
- `runs/evaluations/index.jsonl`

## Workflows

Workflow definitions live in `config/workflows/*.json` and are validated with:

```bash
npm run config:check
```

Set `AGENT_WORKFLOWS_CONFIG_DIR` to point the CLI at another workflow config directory.

- `research-report`: parallel research notes, fact check, contrarian review, final synthesis.
- `ops-weekly`: progress collection, metrics synthesis, blockers, weekly report.
- `meeting-actions`: transcript/materials to action items, priorities, risks.
- `content-ops`: topic framing, research, draft review, fact and policy check.

## Safety Boundary

The system never sends emails, publishes content, deletes files, opens pull requests, deploys, or commits on its own. High-impact actions are listed under `Human Approval Required` for manual review.

## Development

```bash
npm run typecheck
npm test
npm run build
```

After changing workflow config, run:

```bash
npm run config:check
npm run workflow:mock -- ops-weekly examples/inputs/weekly.md
```

## Two-Week Use Loop

Use `ops-weekly` and `meeting-actions` first. After every real run, record time saved, errors, rework, and adoption with `npm run evaluate`. Review the aggregate with `npm run review -- --out runs` at least weekly. Stabilize only workflows that are used three or more times per week or clearly save recurring review time.

## Expansion Ideas

Use [docs/roadmap.md](docs/roadmap.md) and `templates/evaluation/workflow-idea.md` before adding new workflows. Promote ideas that are frequent, file-based, review-heavy, and safe to keep behind human approval.

See [docs/workflows.md](docs/workflows.md) for the workflow config checklist.
