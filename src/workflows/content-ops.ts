import type { WorkflowDefinition } from "./types.js";

export const contentOpsWorkflow: WorkflowDefinition = {
  id: "content-ops",
  title: "Content Operations",
  description:
    "Topic framing, research notes, draft outline, fact check, and review concerns for content work.",
  inputHint: "A content brief, draft, or topic note.",
  specialists: [
    "contentStrategist",
    "researcher",
    "factChecker",
    "riskReviewer",
    "synthesizer"
  ],
  tasks: [
    {
      id: "content-angle",
      title: "Content Angle",
      agent: "contentStrategist",
      parallelGroup: "content-discovery",
      objective:
        "Develop the topic angle, audience fit, outline, draft needs, and brand concerns."
    },
    {
      id: "content-research",
      title: "Content Research",
      agent: "researcher",
      parallelGroup: "content-discovery",
      objective:
        "Extract facts, examples, source labels, and claims that need additional support."
    },
    {
      id: "content-fact-check",
      title: "Content Fact Check",
      agent: "factChecker",
      objective:
        "Find unsupported claims, missing source requirements, and factual uncertainty."
    },
    {
      id: "content-risk-review",
      title: "Content Risk Review",
      agent: "riskReviewer",
      objective:
        "Flag legal, reputational, publication, and brand review risks."
    }
  ],
  managerPrompt:
    "Create a content operations report with angle, evidence needs, draft actions, risks, source confidence, and human approvals before publication.",
  requiredSections: [
    "Executive Summary",
    "Facts And Sources",
    "Risks",
    "Action Items",
    "Human Approval Required",
    "Open Questions"
  ],
  approvalPolicy: [
    "Human review is required before publishing or sending the content externally.",
    "Fact and brand review are required for unsupported benchmarks, customer claims, or legal-sensitive statements."
  ]
};
