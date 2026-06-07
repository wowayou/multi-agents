import { describe, expect, it } from "vitest";
import { specialistAgentKeys } from "../src/agents/definitions.js";
import { WorkflowConfigSchema } from "../src/workflows/config-schema.js";
import { loadWorkflowDefinitions } from "../src/workflows/registry.js";

describe("WorkflowConfigSchema", () => {
  it("accepts the configured workflow set", () => {
    const workflows = loadWorkflowDefinitions();

    expect(workflows).toHaveLength(4);
    expect(workflows.map((workflow) => workflow.id)).toEqual([
      "content-ops",
      "meeting-actions",
      "ops-weekly",
      "research-report"
    ]);
  });

  it("restricts task agents to known specialist keys", () => {
    const result = WorkflowConfigSchema.safeParse({
      id: "bad-workflow",
      title: "Bad Workflow",
      description: "Invalid test workflow.",
      inputHint: "Input.",
      specialists: ["researcher"],
      tasks: [
        {
          id: "bad-task",
          title: "Bad Task",
          agent: "notARealAgent",
          objective: "Fail validation."
        }
      ],
      managerPrompt: "Create a report.",
      requiredSections: ["Executive Summary"],
      approvalPolicy: ["Human review required."]
    });

    expect(result.success).toBe(false);
    expect(specialistAgentKeys).not.toContain("notARealAgent");
  });

  it("requires task agents to be listed in specialists", () => {
    const result = WorkflowConfigSchema.safeParse({
      id: "bad-workflow",
      title: "Bad Workflow",
      description: "Invalid test workflow.",
      inputHint: "Input.",
      specialists: ["researcher"],
      tasks: [
        {
          id: "bad-task",
          title: "Bad Task",
          agent: "factChecker",
          objective: "Fail validation."
        }
      ],
      managerPrompt: "Create a report.",
      requiredSections: ["Executive Summary"],
      approvalPolicy: ["Human review required."]
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["tasks", 0, "agent"]);
  });
});
