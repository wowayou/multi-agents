import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  createEvaluationRecord,
  saveEvaluationRecord,
  summarizeEvaluations
} from "../src/runs/evaluation.js";
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

  it("summarizes adoption, time saved, errors, and rework", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "agent-eval-"));
    const secondTrace: TraceSummary = {
      ...trace,
      runId: "meeting-actions-test",
      workflow: "meeting-actions"
    };
    const firstRecord = createEvaluationRecord(
      trace,
      "runs/traces/ops-weekly-test.json",
      {
        estimatedMinutesBefore: 90,
        actualMinutesAfter: 35,
        adopted: "partial",
        errors: ["missed owner", "missed owner"],
        rework: ["clarify metric source"]
      },
      new Date("2026-06-08T01:00:00.000Z")
    );
    const secondRecord = createEvaluationRecord(
      secondTrace,
      "runs/traces/meeting-actions-test.json",
      {
        estimatedMinutesBefore: 45,
        actualMinutesAfter: 20,
        adopted: "yes",
        errors: ["unclear deadline"],
        rework: ["clarify metric source"]
      },
      new Date("2026-06-08T02:00:00.000Z")
    );

    await saveEvaluationRecord(outputDir, firstRecord);
    await saveEvaluationRecord(outputDir, secondRecord);

    const summary = await summarizeEvaluations(outputDir);

    expect(summary.totalEvaluations).toBe(2);
    expect(summary.workflowRuns).toEqual({
      "meeting-actions": 1,
      "ops-weekly": 1
    });
    expect(summary.adoption).toEqual({
      yes: 1,
      partial: 1,
      no: 0,
      unknown: 0
    });
    expect(summary.totalTimeSavedMinutes).toBe(80);
    expect(summary.averageTimeSavedMinutes).toBe(40);
    expect(summary.errors[0]).toEqual({ text: "missed owner", count: 2 });
    expect(summary.rework[0]).toEqual({
      text: "clarify metric source",
      count: 2
    });
  });

  it("returns an empty summary when no evaluation index exists", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "agent-eval-empty-"));
    const summary = await summarizeEvaluations(outputDir);

    expect(summary.totalEvaluations).toBe(0);
    expect(summary.workflowRuns).toEqual({});
    expect(summary.adoption.unknown).toBe(0);
    expect(summary.errors).toEqual([]);
  });
});
