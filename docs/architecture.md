# Architecture

## Goal

The first version is a practical CLI system, not a web product. It turns local work inputs into repeatable multi-agent workflows with traceable outputs and human review gates.

## Orchestration

Default orchestration uses JSON workflow config, a manager agent, and specialist agents exposed as tools. Research-heavy phases run in parallel with `Promise.all`; final output always passes through review and synthesis before it is saved.

Handoffs are reserved for later routing cases where the request type is ambiguous, such as deciding whether an input is a research request, weekly report request, meeting transcript, or content operations brief.

## Main Directories

- `src/agents`: agent roles, manager construction, runner adapters.
- `config/workflows`: workflow definitions.
- `src/workflows`: workflow config schema and registry.
- `src/tools`: local deterministic utilities for files, risk detection, and audit helpers.
- `src/schemas`: Zod schemas for report and trace structures.
- `src/runs`: execution and artifact persistence.
- `prompts`: versioned prompt notes for specialist roles.
- `examples`: sample inputs.
- `docs`: project docs.

## Safety Model

Inputs are local files. Outputs are local Markdown and JSON files. No external side effects are performed automatically. The reviewer layer flags missing sources, unclear action items, missing risks, and protected actions such as publishing, sending messages, deleting files, deploying, merging, or committing.

## Trace Model

Each run records a compact trace summary:

- run id and workflow id
- workflow config version and short raw config hash
- centralized agent prompt version
- model and mock/real mode
- input file path
- specialist step timing and previews
- audit findings
- artifact paths

Full provider-side tracing can be layered in later through the Agents SDK tracing features.

`npm run compare -- <base-trace> <candidate-trace>` reads two trace summaries without writing new artifacts. It reports workflow, model, mode, input, duration, step label, reviewer finding code, workflow version, config hash, and prompt version differences. Different workflow ids are flagged but still compared so historical traces remain inspectable.

## Evaluation Model

Run evaluations are local JSON records tied to trace files. They capture estimated manual time, actual post-workflow time, adoption, errors, rework, and free-form notes. `npm run review -- --out runs` summarizes the evaluation index so a workflow is promoted only when repeated evaluations show real saved time and manageable error/rework rates.
