import { describe, expect, it } from "vitest";
import {
  compareTraces,
  formatTraceComparison
} from "../src/runs/compare.js";
import type { TraceSummary } from "../src/schemas/trace.js";

const baseTrace: TraceSummary = {
  runId: "ops-weekly-base",
  workflow: "ops-weekly",
  workflowVersion: "1.0.0",
  workflowConfigHash: "aaaaaaaaaaaa",
  agentPromptVersion: "2026-06-08",
  model: "test-model",
  mock: true,
  inputPath: "weekly.md",
  startedAt: "2026-06-08T00:00:00.000Z",
  completedAt: "2026-06-08T00:00:01.000Z",
  durationMs: 1000,
  steps: [
    traceStep("progress-and-metrics"),
    traceStep("ops-risk-review"),
    traceStep("manager")
  ],
  reviewerFindings: [
    {
      code: "missing_sources",
      severity: "warning",
      message: "Add sources."
    },
    {
      code: "unclear_actions",
      severity: "warning",
      message: "Clarify actions."
    }
  ]
};

describe("compareTraces", () => {
  it("summarizes duration, step, finding, version, and hash differences", () => {
    const candidateTrace: TraceSummary = {
      ...baseTrace,
      runId: "ops-weekly-candidate",
      workflowVersion: "1.1.0",
      workflowConfigHash: "bbbbbbbbbbbb",
      agentPromptVersion: "2026-06-09",
      durationMs: 1500,
      steps: [
        traceStep("ops-risk-review"),
        traceStep("progress-and-metrics"),
        traceStep("new-review"),
        traceStep("manager")
      ],
      reviewerFindings: [
        {
          code: "unclear_actions",
          severity: "warning",
          message: "Clarify actions."
        },
        {
          code: "protected_action",
          severity: "warning",
          message: "Approval required."
        }
      ]
    };

    const comparison = compareTraces(
      baseTrace,
      candidateTrace,
      "base.json",
      "candidate.json"
    );
    const formatted = formatTraceComparison(comparison);

    expect(comparison.durationDeltaMs).toBe(500);
    expect(comparison.stepLabels.baseOnly).toEqual([]);
    expect(comparison.stepLabels.candidateOnly).toEqual(["new-review"]);
    expect(comparison.stepLabels.orderChanged).toBe(true);
    expect(comparison.reviewerFindingCodes.baseOnly).toEqual(["missing_sources"]);
    expect(comparison.reviewerFindingCodes.candidateOnly).toEqual([
      "protected_action"
    ]);
    expect(formatted).toContain("Workflow version: 1.0.0 -> 1.1.0 (changed)");
    expect(formatted).toContain("Config hash: aaaaaaaaaaaa -> bbbbbbbbbbbb (changed)");
    expect(formatted).toContain("Agent prompt version: 2026-06-08 -> 2026-06-09 (changed)");
    expect(formatted).toContain("Duration: 1000 ms -> 1500 ms (delta +500 ms)");
    expect(formatted).toContain("Candidate only labels: new-review");
    expect(formatted).toContain("Base only codes: missing_sources");
  });

  it("keeps comparing different workflows and missing optional metadata", () => {
    const oldBase = withoutOptionalMetadata(baseTrace);
    const oldCandidate: TraceSummary = {
      ...withoutOptionalMetadata(baseTrace),
      runId: "meeting-actions-candidate",
      workflow: "meeting-actions"
    };

    const formatted = formatTraceComparison(
      compareTraces(oldBase, oldCandidate, "old-base.json", "old-candidate.json")
    );

    expect(formatted).toContain("different workflows");
    expect(formatted).toContain("Workflow version: missing -> missing (same)");
    expect(formatted).toContain("Config hash: missing -> missing (same)");
    expect(formatted).toContain("Agent prompt version: missing -> missing (same)");
  });
});

function traceStep(label: string): TraceSummary["steps"][number] {
  return {
    label,
    startedAt: "2026-06-08T00:00:00.000Z",
    completedAt: "2026-06-08T00:00:00.100Z",
    durationMs: 100,
    outputPreview: `${label} output`
  };
}

function withoutOptionalMetadata(trace: TraceSummary): TraceSummary {
  const {
    workflowVersion: _workflowVersion,
    workflowConfigHash: _workflowConfigHash,
    agentPromptVersion: _agentPromptVersion,
    ...rest
  } = trace;
  return rest;
}
