import type { WorkflowDefinition } from "./types.js";

export const researchReportWorkflow: WorkflowDefinition = {
  id: "research-report",
  title: "Research Report",
  description:
    "Parallel research, fact checking, contrarian review, and final report synthesis.",
  inputHint: "A research brief or source note file.",
  specialists: ["researcher", "factChecker", "contrarianReviewer", "synthesizer"],
  tasks: [
    {
      id: "evidence-map",
      title: "Evidence Map",
      agent: "researcher",
      parallelGroup: "research",
      objective:
        "Map the strongest evidence, source labels, uncertainties, and confidence levels."
    },
    {
      id: "counter-position",
      title: "Counter Position",
      agent: "contrarianReviewer",
      parallelGroup: "research",
      objective:
        "Identify reasons the main recommendation could be wrong, risky, or premature."
    },
    {
      id: "fact-check",
      title: "Fact Check",
      agent: "factChecker",
      objective:
        "Check the collected notes for unsupported claims, contradictions, and questions needing verification."
    }
  ],
  managerPrompt:
    "Create a concise research report. Include the strongest supported facts, confidence, opposing evidence, risks, recommended next steps, and questions that need human verification.",
  requiredSections: [
    "Executive Summary",
    "Facts And Sources",
    "Risks",
    "Action Items",
    "Human Approval Required",
    "Open Questions"
  ],
  approvalPolicy: [
    "Human review is required before using the report for executive decisions or external communication.",
    "Unsupported claims must be verified against authoritative sources before publication."
  ]
};
