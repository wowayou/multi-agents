# Workflow Playbook

Use this process to turn a repeated work activity into a workflow.

Workflow definitions live in `config/workflows/*.json`. Run `npm run config:check` after adding or changing one.

## 1. Define The Input

Start with a single local file format. Good inputs include:

- research brief
- weekly notes
- meeting transcript
- content brief
- launch checklist

Avoid private integrations until the file-based workflow is useful.

Use `templates/inputs` as the source for real work files. Keep source labels and confidence close to each claim so the reviewer can catch weak inputs before the final report is shared.

## 2. Split The Work

Separate work into specialist steps:

- collect facts
- extract metrics
- identify risks
- draft actions
- challenge assumptions
- synthesize final output

Parallelize only steps that do not depend on each other.

## 3. Define Required Sections

Every workflow should specify required report sections. The default sections are:

- Executive Summary
- Facts And Sources
- Risks
- Action Items
- Human Approval Required
- Open Questions

## 4. Add Review Gates

Reviewer checks should catch:

- claims without sources or confidence
- missing risk section
- unclear action item ownership
- protected external actions
- unresolved questions hidden in prose

## 5. Promote Carefully

Only stabilize workflows that are used repeatedly. A practical threshold is three or more real uses per week. Before adding integrations, confirm that the Markdown output is already useful.

## 6. Evaluate Every Real Run

After a real workflow run, record whether the output was adopted, how much time it saved, what was wrong, and what required rework:

```bash
npm run evaluate -- runs/traces/<run-id>.json --before-min 90 --after-min 35 --adopted partial --error "missed owner" --rework "clarify metric source"
```

Review evaluations weekly:

```bash
npm run review -- --out runs
```

If evaluations show recurring errors, fix prompts/templates before adding new workflows or integrations. When changing a workflow config or prompt, keep a base trace and compare it to a candidate run:

```bash
npm run compare -- runs/traces/<base-run-id>.json runs/traces/<candidate-run-id>.json
```

The comparison highlights duration, step labels, reviewer finding codes, workflow version, config hash, and prompt version differences for the two-week review.

## 7. Choose The Next Workflow

Use `templates/evaluation/workflow-idea.md` to score candidates. Prefer workflows that repeat weekly, have clear input files, create review burden, and can deliver value without external side effects.
