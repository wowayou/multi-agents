import { describe, expect, it } from "vitest";
import { createEvaluationRecord } from "../src/runs/evaluation.js";
import type { TraceSummary } from "../src/schemas/trace.js";

const trace: TraceSummary = {
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

describe("createEvaluationRecord", () => {
  it("computes saved minutes and cleans text lists", () => {
    const record = createEvaluationRecord(
      trace,
      "runs/traces/ops-weekly-test.json",
      {
        estimatedMinutesBefore: 90,
        actualMinutesAfter: 35,
        adopted: "partial",
        errors: [" missed owner ", ""],
        rework: ["clarify metric source"],
        notes: ["useful summary"]
      },
      new Date("2026-06-08T01:00:00.000Z")
    );

    expect(record.timeSavedMinutes).toBe(55);
    expect(record.errors).toEqual(["missed owner"]);
    expect(record.adopted).toBe("partial");
  });

  it("allows unknown time savings when time fields are missing", () => {
    const record = createEvaluationRecord(
      trace,
      "runs/traces/ops-weekly-test.json",
      {
        adopted: "unknown"
      },
      new Date("2026-06-08T01:00:00.000Z")
    );

    expect(record.timeSavedMinutes).toBeUndefined();
  });
});
