import { describe, expect, it } from "vitest";
import { WorkflowReportSchema } from "../src/schemas/report.js";
import { TraceSummarySchema } from "../src/schemas/trace.js";

describe("WorkflowReportSchema", () => {
  it("accepts a valid report shape", () => {
    const result = WorkflowReportSchema.safeParse({
      workflow: "research-report",
      title: "Research Report",
      executiveSummary: ["Summary"],
      evidence: [
        {
          claim: "Claim",
          source: "local input",
          confidence: "medium",
          needsConfirmation: true
        }
      ],
      risks: [
        {
          risk: "Risk",
          severity: "medium",
          mitigation: "Review"
        }
      ],
      actionItems: [
        {
          owner: "Human reviewer",
          task: "Verify",
          priority: "high"
        }
      ],
      openQuestions: ["Question"],
      humanApprovalRequired: ["Approval"],
      reviewerFindings: [],
      markdown: "# Report"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid confidence values", () => {
    const result = WorkflowReportSchema.safeParse({
      workflow: "research-report",
      title: "Research Report",
      executiveSummary: ["Summary"],
      evidence: [
        {
          claim: "Claim",
          source: "local input",
          confidence: "certain"
        }
      ],
      risks: [],
      actionItems: [],
      openQuestions: ["Question"],
      humanApprovalRequired: ["Approval"],
      reviewerFindings: [],
      markdown: "# Report"
    });

    expect(result.success).toBe(false);
  });
});

describe("TraceSummarySchema", () => {
  const oldTrace = {
    runId: "ops-weekly-test",
    workflow: "ops-weekly",
    model: "test-model",
    mock: true,
    inputPath: "weekly.md",
    startedAt: "2026-06-08T00:00:00.000Z",
    completedAt: "2026-06-08T00:01:00.000Z",
    durationMs: 60000,
    steps: [],
    reviewerFindings: []
  };

  it("accepts old traces without version metadata", () => {
    expect(TraceSummarySchema.safeParse(oldTrace).success).toBe(true);
  });

  it("accepts new traces with workflow and prompt metadata", () => {
    const result = TraceSummarySchema.safeParse({
      ...oldTrace,
      workflowVersion: "1.0.0",
      workflowConfigHash: "abcdef123456",
      agentPromptVersion: "2026-06-08"
    });

    expect(result.success).toBe(true);
  });
});
