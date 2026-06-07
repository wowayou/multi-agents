import { readFile } from "node:fs/promises";
import { TraceSummarySchema, type TraceSummary } from "../schemas/trace.js";

export interface TraceComparison {
  baseTracePath: string;
  candidateTracePath: string;
  base: TraceSummary;
  candidate: TraceSummary;
  differentWorkflows: boolean;
  durationDeltaMs: number;
  stepLabels: LabelComparison;
  reviewerFindingCodes: LabelComparison;
}

export interface LabelComparison {
  baseOnly: string[];
  candidateOnly: string[];
  orderChanged: boolean;
}

export async function compareTraceFiles(
  baseTracePath: string,
  candidateTracePath: string
): Promise<TraceComparison> {
  const [base, candidate] = await Promise.all([
    readTrace(baseTracePath),
    readTrace(candidateTracePath)
  ]);

  return compareTraces(base, candidate, baseTracePath, candidateTracePath);
}

export function compareTraces(
  base: TraceSummary,
  candidate: TraceSummary,
  baseTracePath = "base",
  candidateTracePath = "candidate"
): TraceComparison {
  const stepLabels = compareLabels(
    base.steps.map((step) => step.label),
    candidate.steps.map((step) => step.label)
  );
  const reviewerFindingCodes = compareLabels(
    base.reviewerFindings.map((finding) => finding.code),
    candidate.reviewerFindings.map((finding) => finding.code)
  );

  return {
    baseTracePath,
    candidateTracePath,
    base,
    candidate,
    differentWorkflows: base.workflow !== candidate.workflow,
    durationDeltaMs: candidate.durationMs - base.durationMs,
    stepLabels,
    reviewerFindingCodes
  };
}

export function formatTraceComparison(comparison: TraceComparison): string {
  const { base, candidate } = comparison;

  return [
    "Trace Comparison",
    `Base: ${comparison.baseTracePath}`,
    `Candidate: ${comparison.candidateTracePath}`,
    "",
    "Run Metadata",
    formatWorkflowLine(comparison),
    formatValueLine("Workflow version", base.workflowVersion, candidate.workflowVersion),
    formatValueLine(
      "Config hash",
      base.workflowConfigHash,
      candidate.workflowConfigHash
    ),
    formatValueLine(
      "Agent prompt version",
      base.agentPromptVersion,
      candidate.agentPromptVersion
    ),
    formatValueLine("Model", base.model, candidate.model),
    formatValueLine("Mode", modeLabel(base.mock), modeLabel(candidate.mock)),
    formatValueLine("Input", base.inputPath, candidate.inputPath),
    `Duration: ${formatMilliseconds(base.durationMs)} -> ${formatMilliseconds(candidate.durationMs)} (delta ${formatSignedMilliseconds(comparison.durationDeltaMs)})`,
    "",
    "Steps",
    `Count: ${base.steps.length} -> ${candidate.steps.length}`,
    `Base only labels: ${formatList(comparison.stepLabels.baseOnly)}`,
    `Candidate only labels: ${formatList(comparison.stepLabels.candidateOnly)}`,
    `Shared label order: ${comparison.stepLabels.orderChanged ? "changed" : "same"}`,
    "",
    "Reviewer Findings",
    `Count: ${base.reviewerFindings.length} -> ${candidate.reviewerFindings.length}`,
    `Base only codes: ${formatList(comparison.reviewerFindingCodes.baseOnly)}`,
    `Candidate only codes: ${formatList(comparison.reviewerFindingCodes.candidateOnly)}`
  ].join("\n");
}

async function readTrace(tracePath: string): Promise<TraceSummary> {
  const raw = await readFile(tracePath, "utf8");
  return TraceSummarySchema.parse(JSON.parse(raw));
}

function compareLabels(base: string[], candidate: string[]): LabelComparison {
  const baseValues = uniqueSorted(base);
  const candidateValues = uniqueSorted(candidate);
  const candidateSet = new Set(candidateValues);
  const baseSet = new Set(baseValues);
  const sharedBaseOrder = base.filter((value) => candidateSet.has(value));
  const sharedCandidateOrder = candidate.filter((value) => baseSet.has(value));

  return {
    baseOnly: baseValues.filter((value) => !candidateSet.has(value)),
    candidateOnly: candidateValues.filter((value) => !baseSet.has(value)),
    orderChanged: sharedBaseOrder.join("\0") !== sharedCandidateOrder.join("\0")
  };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function formatWorkflowLine(comparison: TraceComparison): string {
  const status = comparison.differentWorkflows
    ? "different workflows"
    : "same workflow";
  return `Workflow: ${comparison.base.workflow} -> ${comparison.candidate.workflow} (${status})`;
}

function formatValueLine(
  label: string,
  baseValue: string | undefined,
  candidateValue: string | undefined
): string {
  const base = formatOptional(baseValue);
  const candidate = formatOptional(candidateValue);
  const status = base === candidate ? "same" : "changed";
  return `${label}: ${base} -> ${candidate} (${status})`;
}

function formatOptional(value: string | undefined): string {
  return value ?? "missing";
}

function modeLabel(mock: boolean): string {
  return mock ? "mock" : "real";
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

function formatMilliseconds(value: number): string {
  return `${value} ms`;
}

function formatSignedMilliseconds(value: number): string {
  if (value > 0) {
    return `+${formatMilliseconds(value)}`;
  }
  return formatMilliseconds(value);
}
