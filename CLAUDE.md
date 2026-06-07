# Claude Project Notes

This repository is a local CLI project for multi-agent work operations. Treat robustness and scope control as higher priority than adding features.

## How To Work Here

- Read `README.md`, `docs/architecture.md`, and `docs/playbook.md` before changing workflow behavior.
- Use existing patterns in `src/workflows`, `src/runs`, `src/schemas`, and `src/tools`.
- Validate changes with `npm run typecheck`, `npm test`, and `npm run build`.
- Use `npm run workflow:mock -- <workflow-id> <input-file>` to verify CLI behavior without an API key.

## Guardrails

- No automatic external side effects.
- No private integrations until the file-based workflows are repeatedly useful.
- Human approval is required before sending, publishing, deleting, merging, deploying, committing, or opening pull requests.
- Keep reports explicit about sources, confidence, risks, action items, and open questions.

## Current Priority

Stabilize `ops-weekly` and `meeting-actions` with real inputs for two weeks. Use `npm run evaluate` after each run to track time saved, adoption, errors, and rework.

Use `docs/roadmap.md` before adding new workflows. New ideas should pass the frequency, file-input, review-burden, and safety checks first.
