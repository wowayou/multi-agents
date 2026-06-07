# Agent Instructions

## Project Purpose

This project is a CLI-first multi-agent workflow system for work operations. It accepts local Markdown files, runs OpenAI Agents SDK specialists, produces Markdown reports, writes JSON traces, and records run evaluations.

## Commands

- `npm run workflow -- <workflow-id> <input-file>` runs a real workflow and requires `OPENAI_API_KEY`.
- `npm run workflow:mock -- <workflow-id> <input-file>` runs deterministic local preview mode.
- `npm run templates` lists input and evaluation templates.
- `npm run evaluate -- <trace-file> ...` records adoption, time saved, errors, and rework.
- `npm run typecheck`, `npm test`, and `npm run build` are the required verification commands after code changes.

## Scope Boundaries

- Keep the MVP file-based until repeated evaluations prove a workflow is useful.
- Do not add Gmail, Calendar, Notion, publishing, git, deploy, or PR side effects without explicit user approval.
- Do not auto-send, publish, delete, merge, deploy, commit, or open pull requests.
- Prefer improving templates, prompts, schemas, tests, and reviewer checks before adding new surfaces.

## Robustness Rules

- Keep workflow outputs traceable: every important claim needs a source label and confidence.
- Preserve human approval gates for protected actions.
- Add tests for schema, parser, reviewer, and persistence changes.
- Keep generated runtime files under `runs/`; they are ignored by git.
- Keep docs synchronized when commands, outputs, templates, or workflow behavior changes.
- Use `docs/roadmap.md` and `templates/evaluation/workflow-idea.md` before adding new workflows.
