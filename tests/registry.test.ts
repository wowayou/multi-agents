import { describe, expect, it } from "vitest";
import { listWorkflows, resolveWorkflow } from "../src/workflows/registry.js";

describe("workflow registry", () => {
  it("routes known workflows", () => {
    expect(resolveWorkflow("research-report").id).toBe("research-report");
    expect(resolveWorkflow("ops-weekly").id).toBe("ops-weekly");
    expect(resolveWorkflow("meeting-actions").id).toBe("meeting-actions");
    expect(resolveWorkflow("content-ops").id).toBe("content-ops");
  });

  it("lists the initial workflow set", () => {
    expect(listWorkflows().map((workflow) => workflow.id)).toEqual([
      "content-ops",
      "meeting-actions",
      "ops-weekly",
      "research-report"
    ]);
  });

  it("rejects unknown workflows", () => {
    expect(() => resolveWorkflow("unknown")).toThrow(/Unknown workflow/);
  });
});
