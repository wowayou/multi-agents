#!/usr/bin/env node
import { loadRuntimeConfig } from "./config.js";
import {
  LocalPreviewRunner,
  OpenAIAgentsRunner
} from "./agents/runner.js";
import { executeWorkflow } from "./runs/execute.js";
import {
  createEvaluationRecord,
  readTraceSummary,
  saveEvaluationRecord,
  summarizeEvaluations,
  type EvaluationSummary,
  type EvaluationTextFrequency
} from "./runs/evaluation.js";
import { compareTraceFiles, formatTraceComparison } from "./runs/compare.js";
import { readInputDocument, saveRunArtifacts } from "./tools/files.js";
import {
  listWorkflows,
  resolveWorkflow,
  validateWorkflowConfigs
} from "./workflows/registry.js";
import type { Adoption } from "./schemas/evaluation.js";

interface ParsedArgs {
  command:
    | "workflow"
    | "list"
    | "templates"
    | "evaluate"
    | "review"
    | "compare"
    | "config-check"
    | "help";
  workflowId?: string;
  inputPath?: string;
  tracePath?: string;
  candidateTracePath?: string;
  mock?: boolean;
  outputDir?: string;
  model?: string;
  save?: boolean;
  estimatedMinutesBefore?: number;
  actualMinutesAfter?: number;
  adopted?: Adoption;
  errors?: string[];
  rework?: string[];
  notes?: string[];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === "help") {
    printHelp();
    return;
  }

  if (args.command === "list") {
    for (const workflow of listWorkflows()) {
      console.log(`${workflow.id}\t${workflow.description}`);
    }
    return;
  }

  if (args.command === "templates") {
    printTemplates();
    return;
  }

  if (args.command === "config-check") {
    const workflows = validateWorkflowConfigs();
    console.log(`Workflow configs: ${workflows.length} valid`);
    console.log(`IDs: ${workflows.map((workflow) => workflow.id).join(", ")}`);
    return;
  }

  if (args.command === "evaluate") {
    if (!args.tracePath) {
      throw new Error(
        "Usage: npm run evaluate -- <trace-file> [--before-min 90] [--after-min 30] [--adopted yes|partial|no|unknown]"
      );
    }

    const trace = await readTraceSummary(args.tracePath);
    const record = createEvaluationRecord(trace, args.tracePath, {
      estimatedMinutesBefore: args.estimatedMinutesBefore,
      actualMinutesAfter: args.actualMinutesAfter,
      adopted: args.adopted,
      errors: args.errors,
      rework: args.rework,
      notes: args.notes
    });
    const artifacts = await saveEvaluationRecord(
      args.outputDir ?? process.env.AGENT_WORKFLOWS_OUT_DIR ?? "runs",
      record
    );

    console.log(`Evaluation: ${artifacts.evaluationPath}`);
    console.log(`Index: ${artifacts.indexPath}`);
    if (record.timeSavedMinutes !== undefined) {
      console.log(`Time saved: ${record.timeSavedMinutes} minutes`);
    }
    return;
  }

  if (args.command === "review") {
    const summary = await summarizeEvaluations(
      args.outputDir ?? process.env.AGENT_WORKFLOWS_OUT_DIR ?? "runs"
    );
    console.log(formatEvaluationReview(summary));
    return;
  }

  if (args.command === "compare") {
    if (!args.tracePath || !args.candidateTracePath) {
      throw new Error("Usage: npm run compare -- <base-trace> <candidate-trace>");
    }

    const comparison = await compareTraceFiles(
      args.tracePath,
      args.candidateTracePath
    );
    console.log(formatTraceComparison(comparison));
    return;
  }

  if (!args.workflowId || !args.inputPath) {
    throw new Error(
      "Usage: npm run workflow -- <workflow-id> <input-file> [--mock] [--out runs]"
    );
  }

  const workflow = resolveWorkflow(args.workflowId);
  const input = await readInputDocument(args.inputPath);
  const config = loadRuntimeConfig({
    mock: args.mock,
    model: args.model,
    outputDir: args.outputDir,
    save: args.save
  });
  const runner = config.mock
    ? new LocalPreviewRunner()
    : new OpenAIAgentsRunner();
  const result = await executeWorkflow(workflow, input, { runner, config });

  if (config.save) {
    const artifacts = await saveRunArtifacts(
      config.outputDir,
      result.report,
      result.trace
    );
    console.log(`Workflow: ${workflow.id}`);
    console.log(`Mode: ${config.mock ? "mock" : "real"}`);
    console.log(`Report: ${artifacts.reportPath}`);
    console.log(`Trace: ${artifacts.tracePath}`);
    return;
  }

  console.log(result.report.markdown);
}

function parseArgs(rawArgs: string[]): ParsedArgs {
  const args = [...rawArgs];
  if (args[0] === "workflow") {
    args.shift();
  }

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return { command: "help" };
  }

  if (args[0] === "list") {
    return { command: "list" };
  }

  if (args[0] === "templates") {
    return { command: "templates" };
  }

  if (args[0] === "config-check" || args[0] === "config:check") {
    return { command: "config-check" };
  }

  if (args[0] === "evaluate") {
    return parseEvaluateArgs(args.slice(1));
  }

  if (args[0] === "review") {
    return parseReviewArgs(args.slice(1));
  }

  if (args[0] === "compare") {
    return parseCompareArgs(args.slice(1));
  }

  const positionals: string[] = [];
  const parsed: ParsedArgs = { command: "workflow" };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--mock") {
      parsed.mock = true;
      continue;
    }

    if (arg === "--no-save") {
      parsed.save = false;
      continue;
    }

    if (arg === "--out") {
      parsed.outputDir = requireValue(args, index, "--out");
      index += 1;
      continue;
    }

    if (arg === "--model") {
      parsed.model = requireValue(args, index, "--model");
      index += 1;
      continue;
    }

    positionals.push(arg);
  }

  parsed.workflowId = positionals[0];
  parsed.inputPath = positionals[1];
  return parsed;
}

function parseCompareArgs(args: string[]): ParsedArgs {
  const positionals: string[] = [];
  const parsed: ParsedArgs = { command: "compare" };

  for (const arg of args) {
    if (arg === "--") {
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown compare option: ${arg}`);
    }

    positionals.push(arg);
  }

  parsed.tracePath = positionals[0];
  parsed.candidateTracePath = positionals[1];
  return parsed;
}

function parseReviewArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = { command: "review" };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--out") {
      parsed.outputDir = requireValue(args, index, "--out");
      index += 1;
      continue;
    }

    throw new Error(`Unknown review option: ${arg}`);
  }

  return parsed;
}

function parseEvaluateArgs(args: string[]): ParsedArgs {
  const positionals: string[] = [];
  const parsed: ParsedArgs = {
    command: "evaluate",
    errors: [],
    rework: [],
    notes: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--out") {
      parsed.outputDir = requireValue(args, index, "--out");
      index += 1;
      continue;
    }

    if (arg === "--before-min") {
      parsed.estimatedMinutesBefore = requireNonNegativeNumber(
        args,
        index,
        "--before-min"
      );
      index += 1;
      continue;
    }

    if (arg === "--after-min") {
      parsed.actualMinutesAfter = requireNonNegativeNumber(
        args,
        index,
        "--after-min"
      );
      index += 1;
      continue;
    }

    if (arg === "--adopted") {
      parsed.adopted = requireAdoption(args, index);
      index += 1;
      continue;
    }

    if (arg === "--error") {
      parsed.errors?.push(requireValue(args, index, "--error"));
      index += 1;
      continue;
    }

    if (arg === "--rework") {
      parsed.rework?.push(requireValue(args, index, "--rework"));
      index += 1;
      continue;
    }

    if (arg === "--note") {
      parsed.notes?.push(requireValue(args, index, "--note"));
      index += 1;
      continue;
    }

    positionals.push(arg);
  }

  parsed.tracePath = positionals[0];
  return parsed;
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function requireNonNegativeNumber(
  args: string[],
  index: number,
  flag: string
): number {
  const raw = requireValue(args, index, flag);
  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${flag} requires a non-negative number.`);
  }

  return value;
}

function requireAdoption(args: string[], index: number): Adoption {
  const value = requireValue(args, index, "--adopted");
  if (
    value === "yes" ||
    value === "partial" ||
    value === "no" ||
    value === "unknown"
  ) {
    return value;
  }

  throw new Error("--adopted must be one of: yes, partial, no, unknown.");
}

function printHelp(): void {
  console.log(`Usage:
  npm run workflow -- <workflow-id> <input-file> [--mock] [--out runs]
  npm run list
  npm run templates
  npm run evaluate -- <trace-file> [--before-min 90] [--after-min 30] [--adopted yes|partial|no|unknown]
  npm run review -- [--out runs]
  npm run compare -- <base-trace> <candidate-trace>
  npm run config:check

Workflows:
${listWorkflows()
  .map((workflow) => `  ${workflow.id} - ${workflow.description}`)
  .join("\n")}
`);
}

function formatEvaluationReview(summary: EvaluationSummary): string {
  if (summary.totalEvaluations === 0) {
    return [
      `No evaluations found in ${summary.indexPath}.`,
      "Run npm run evaluate -- <trace-file> after workflow runs to record adoption, time saved, errors, and rework."
    ].join("\n");
  }

  return [
    "Evaluation Review",
    `Index: ${summary.indexPath}`,
    `Evaluations: ${summary.totalEvaluations}`,
    `Workflows: ${formatWorkflowRuns(summary.workflowRuns)}`,
    `Adoption: yes ${summary.adoption.yes}, partial ${summary.adoption.partial}, no ${summary.adoption.no}, unknown ${summary.adoption.unknown}`,
    `Time saved: total ${formatMinutes(summary.totalTimeSavedMinutes)}, average ${formatAverageTimeSaved(summary)}`,
    "Common errors:",
    formatTextFrequency(summary.errors),
    "Common rework:",
    formatTextFrequency(summary.rework)
  ].join("\n");
}

function formatWorkflowRuns(workflowRuns: Record<string, number>): string {
  return Object.entries(workflowRuns)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([workflow, count]) => `${workflow} ${count}`)
    .join(", ");
}

function formatAverageTimeSaved(summary: EvaluationSummary): string {
  if (summary.averageTimeSavedMinutes === undefined) {
    return "unknown";
  }

  const suffix = summary.timeSavedSampleCount === 1 ? "" : "s";
  return `${formatMinutes(summary.averageTimeSavedMinutes)} across ${summary.timeSavedSampleCount} measured evaluation${suffix}`;
}

function formatMinutes(value: number): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} minutes`;
}

function formatTextFrequency(items: EvaluationTextFrequency[]): string {
  if (items.length === 0) {
    return "  none recorded";
  }

  return items
    .slice(0, 5)
    .map((item) => `  - ${item.text} (${item.count})`)
    .join("\n");
}

function printTemplates(): void {
  console.log(`Templates:
  research-report  templates/inputs/research-report.md
  ops-weekly       templates/inputs/ops-weekly.md
  meeting-actions  templates/inputs/meeting-actions.md
  content-ops      templates/inputs/content-ops.md
  run-evaluation   templates/evaluation/run-evaluation.md
  workflow-idea    templates/evaluation/workflow-idea.md
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
