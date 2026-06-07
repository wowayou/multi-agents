# Roadmap And Workflow Ideas

This project should grow by repeated usefulness, not by adding integrations early. Use this roadmap to decide what to build next after the first two-week pilot.

## Promotion Criteria

Promote a workflow only when most of these are true:

- Used at least three times per week or clearly saves recurring review time.
- Input can be provided as a local Markdown, CSV, transcript, or exported text file.
- Output has a human reviewer before external action.
- Evaluation records show saved time with acceptable errors and rework.
- The workflow improves decisions, not just formatting.

Avoid workflows that require hidden private context, irreversible external actions, or live system permissions before the file-based version proves useful.

## Near-Term Ideas

- `customer-intel`: support tags, interview notes, sales notes -> themes, evidence, product opportunities, objections.
- `decision-brief`: messy context -> options, tradeoffs, risks, missing facts, recommended decision memo.
- `launch-readiness`: launch checklist -> blockers, approval gaps, rollback needs, go/no-go summary.
- `crm-cleanup`: exported account list -> duplicate risks, missing fields, merge suggestions, human approval list.
- `hiring-review`: interview notes -> signal summary, concerns, calibration questions, no-hire risks.

## Operating Cadence

- Daily: run meeting/action workflows after important calls.
- Weekly: run `ops-weekly`, evaluate saved time, review recurring errors.
- Biweekly: choose one workflow improvement based on evaluation data.
- Monthly: decide whether an integration is justified by usage volume.

## Product Direction

The product shape should stay boring until usage is proven:

- Phase 1: CLI workflows, templates, local traces, evaluations.
- Phase 2: configurable workflow definitions, prompt versions, run comparison.
- Phase 3: lightweight local dashboard for reports and evaluations.
- Phase 4: optional MCP/private integrations with explicit approval gates.

The best product insight will come from evaluation records: which workflows are reused, where humans still edit heavily, and which outputs become decision artifacts.
