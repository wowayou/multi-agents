import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
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

  it("includes workflow version and raw config hash", () => {
    const workflow = resolveWorkflow("ops-weekly");
    const raw = readFileSync(
      path.join(process.cwd(), "config", "workflows", "ops-weekly.json"),
      "utf8"
    );
    const expectedHash = createHash("sha256")
      .update(raw)
      .digest("hex")
      .slice(0, 12);

    expect(workflow.version).toBe("1.0.0");
    expect(workflow.configHash).toBe(expectedHash);
  });

  it("rejects unknown workflows", () => {
    expect(() => resolveWorkflow("unknown")).toThrow(/Unknown workflow/);
  });
});
