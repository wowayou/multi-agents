import { describe, expect, it } from "vitest";
import { WorkflowReportSchema } from "../src/schemas/report.js";

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
