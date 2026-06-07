import { describe, expect, it } from "vitest";
import { reviewMarkdownReport } from "../src/tools/risk.js";
import { researchReportWorkflow } from "../src/workflows/research-report.js";

describe("reviewMarkdownReport", () => {
  it("flags missing sources, missing risks, and unclear actions", () => {
    const audit = reviewMarkdownReport(
      [
        "# Draft",
        "",
        "## Executive Summary",
        "- Launch the plan.",
        "",
        "## Action Items",
        "",
        "## Open Questions",
        "- None."
      ].join("\n"),
      researchReportWorkflow
    );

    expect(audit.reviewerFindings.map((finding) => finding.code)).toContain(
      "missing_sources"
    );
    expect(audit.reviewerFindings.map((finding) => finding.code)).toContain(
      "missing_risks"
    );
    expect(audit.reviewerFindings.map((finding) => finding.code)).toContain(
      "unclear_actions"
    );
  });

  it("keeps protected actions behind human approval", () => {
    const audit = reviewMarkdownReport(
      [
        "# Draft",
        "",
        "## Executive Summary",
        "- Summary.",
        "",
        "## Facts And Sources",
        "- Claim: based on input. Source: local input. Confidence: medium.",
        "",
        "## Risks",
        "- Risk exists.",
        "",
        "## Action Items",
        "- Send email to all customers tomorrow.",
        "",
        "## Human Approval Required",
        "- Review before sending.",
        "",
        "## Open Questions",
        "- None."
      ].join("\n"),
      researchReportWorkflow
    );

    expect(audit.protectedActions).toHaveLength(1);
    expect(audit.humanApprovalRequired.join("\n")).toMatch(/Send email/i);
  });
});
