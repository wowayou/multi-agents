import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  RunEvaluationRecordSchema,
  type Adoption,
  type RunEvaluationRecord
} from "../schemas/evaluation.js";
import { TraceSummarySchema, type TraceSummary } from "../schemas/trace.js";

export interface RunEvaluationInput {
  estimatedMinutesBefore?: number;
  actualMinutesAfter?: number;
  adopted?: Adoption;
  errors?: string[];
  rework?: string[];
  notes?: string[];
}

export interface SavedEvaluationArtifacts {
  evaluationPath: string;
  indexPath: string;
}

export interface EvaluationTextFrequency {
  text: string;
  count: number;
}

export interface EvaluationSummary {
  indexPath: string;
  totalEvaluations: number;
  workflowRuns: Record<string, number>;
  adoption: Record<Adoption, number>;
  totalTimeSavedMinutes: number;
  averageTimeSavedMinutes?: number;
  timeSavedSampleCount: number;
  errors: EvaluationTextFrequency[];
  rework: EvaluationTextFrequency[];
}

export async function readTraceSummary(tracePath: string): Promise<TraceSummary> {
  const raw = await readFile(tracePath, "utf8");
  return TraceSummarySchema.parse(JSON.parse(raw));
}

export function createEvaluationRecord(
  trace: TraceSummary,
  tracePath: string,
  input: RunEvaluationInput,
  now = new Date()
): RunEvaluationRecord {
  return RunEvaluationRecordSchema.parse({
    runId: trace.runId,
    workflow: trace.workflow,
    tracePath,
    evaluatedAt: now.toISOString(),
    estimatedMinutesBefore: input.estimatedMinutesBefore,
    actualMinutesAfter: input.actualMinutesAfter,
    timeSavedMinutes: computeTimeSavedMinutes(
      input.estimatedMinutesBefore,
      input.actualMinutesAfter
    ),
    adopted: input.adopted ?? "unknown",
    errors: cleanList(input.errors),
    rework: cleanList(input.rework),
    notes: cleanList(input.notes)
  });
}

export async function saveEvaluationRecord(
  outputDir: string,
  record: RunEvaluationRecord
): Promise<SavedEvaluationArtifacts> {
  const evaluationsDir = path.join(outputDir, "evaluations");
  await mkdir(evaluationsDir, { recursive: true });

  const evaluationPath = path.join(evaluationsDir, `${record.runId}.json`);
  const indexPath = path.join(evaluationsDir, "index.jsonl");
  const serialized = `${JSON.stringify(record, null, 2)}\n`;

  await writeFile(evaluationPath, serialized, "utf8");
  await appendFile(indexPath, `${JSON.stringify(record)}\n`, "utf8");

  return { evaluationPath, indexPath };
}

export async function summarizeEvaluations(
  outputDir: string
): Promise<EvaluationSummary> {
  const indexPath = path.join(outputDir, "evaluations", "index.jsonl");
  const records = await readEvaluationIndex(indexPath);
  const adoption = {
    yes: 0,
    partial: 0,
    no: 0,
    unknown: 0
  } satisfies Record<Adoption, number>;
  const workflowRuns: Record<string, number> = {};
  let totalTimeSavedMinutes = 0;
  let timeSavedSampleCount = 0;

  for (const record of records) {
    workflowRuns[record.workflow] = (workflowRuns[record.workflow] ?? 0) + 1;
    adoption[record.adopted] += 1;

    if (record.timeSavedMinutes !== undefined) {
      totalTimeSavedMinutes += record.timeSavedMinutes;
      timeSavedSampleCount += 1;
    }
  }

  return {
    indexPath,
    totalEvaluations: records.length,
    workflowRuns,
    adoption,
    totalTimeSavedMinutes,
    averageTimeSavedMinutes:
      timeSavedSampleCount > 0
        ? totalTimeSavedMinutes / timeSavedSampleCount
        : undefined,
    timeSavedSampleCount,
    errors: countTextFrequency(records.flatMap((record) => record.errors)),
    rework: countTextFrequency(records.flatMap((record) => record.rework))
  };
}

function computeTimeSavedMinutes(
  estimatedMinutesBefore?: number,
  actualMinutesAfter?: number
): number | undefined {
  if (
    estimatedMinutesBefore === undefined ||
    actualMinutesAfter === undefined
  ) {
    return undefined;
  }

  return estimatedMinutesBefore - actualMinutesAfter;
}

function cleanList(values?: string[]): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

async function readEvaluationIndex(
  indexPath: string
): Promise<RunEvaluationRecord[]> {
  let raw: string;

  try {
    raw = await readFile(indexPath, "utf8");
  } catch (error) {
    if (isFileNotFound(error)) {
      return [];
    }
    throw error;
  }

  const records: RunEvaluationRecord[] = [];
  const lines = raw.split("\n");

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      records.push(RunEvaluationRecordSchema.parse(JSON.parse(trimmed)));
    } catch (error) {
      const lineNumber = index + 1;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${indexPath}:${lineNumber}: invalid evaluation record: ${message}`
      );
    }
  }

  return records;
}

function countTextFrequency(values: string[]): EvaluationTextFrequency[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const cleaned = value.trim().replace(/\s+/g, " ");
    if (!cleaned) {
      continue;
    }
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }
      return left.text.localeCompare(right.text);
    });
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}
