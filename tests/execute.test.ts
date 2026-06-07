import { describe, expect, it } from "vitest";
import { AGENT_PROMPT_VERSION } from "../src/agents/definitions.js";
import { LocalPreviewRunner } from "../src/agents/runner.js";
import { executeWorkflow } from "../src/runs/execute.js";
import { resolveWorkflow } from "../src/workflows/registry.js";

describe("executeWorkflow", () => {
  it("runs research-report in local preview mode with required report sections", async () => {
    const result = await executeWorkflow(
      resolveWorkflow("research-report"),
      {
        path: "mock-input.md",
        content:
          "# Brief\n\nSource: customer interviews.\n\nQuestion: Should we create a weekly digest?"
      },
      {
        runner: new LocalPreviewRunner(),
        config: {
          model: "test-model",
          mock: true,
          outputDir: "runs",
          save: false
        }
      }
    );

    expect(result.report.markdown).toContain("## Facts And Sources");
    expect(result.report.markdown).toContain("## Risks");
    expect(result.report.markdown).toContain("## Action Items");
    expect(result.report.humanApprovalRequired.length).toBeGreaterThan(0);
    expect(result.trace.steps.map((step) => step.label)).toContain("manager");
    expect(result.trace.workflowVersion).toBe("1.0.0");
    expect(result.trace.workflowConfigHash).toMatch(/^[a-f0-9]{12}$/);
    expect(result.trace.agentPromptVersion).toBe(AGENT_PROMPT_VERSION);
  });
});
