import { randomUUID } from "node:crypto";
import type { RuntimeConfig } from "../config.js";
import {
  AGENT_PROMPT_VERSION,
  createSpecialistAgents
} from "../agents/definitions.js";
import { createWorkflowManager } from "../agents/manager.js";
import type { AgentRunResult, AgentRunner } from "../agents/runner.js";
import {
  ActionItemSchema,
  EvidenceItemSchema,
  RiskItemSchema,
  WorkflowReportSchema,
  type WorkflowReport
} from "../schemas/report.js";
import { TraceSummarySchema, type TraceSummary } from "../schemas/trace.js";
import type { InputDocument } from "../tools/files.js";
import {
  ensureRequiredSections,
  reviewMarkdownReport
} from "../tools/risk.js";
import type { WorkflowDefinition, WorkflowTask } from "../workflows/types.js";

export interface WorkflowExecutionOptions {
  runner: AgentRunner;
  config: RuntimeConfig;
}

export interface WorkflowExecutionResult {
  report: WorkflowReport;
  trace: TraceSummary;
}

export async function executeWorkflow(
  workflow: WorkflowDefinition,
  input: InputDocument,
  options: WorkflowExecutionOptions
): Promise<WorkflowExecutionResult> {
  const runId = `${workflow.id}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const started = new Date();
  const specialists = createSpecialistAgents(options.config.model);
  const manager = createWorkflowManager(
    workflow,
    specialists,
    options.config.model
  );
  const stepResults: AgentRunResult[] = [];

  for (const batch of taskBatches(workflow.tasks)) {
    const results = await Promise.all(
      batch.map((task) =>
        options.runner.runAgent(
          specialists[task.agent],
          buildTaskInput(workflow, input, task, stepResults),
          task.id
        )
      )
    );
    stepResults.push(...results);
  }

  const managerResult = await options.runner.runAgent(
    manager,
    buildManagerInput(workflow, input, stepResults),
    "manager"
  );
  stepResults.push(managerResult);

  const draftAudit = reviewMarkdownReport(managerResult.output, workflow);
  const markdown = ensureRequiredSections(managerResult.output, workflow);
  const finalAudit = reviewMarkdownReport(markdown, workflow);
  const audit = {
    missingSections: draftAudit.missingSections,
    protectedActions: uniqueStrings([
      ...draftAudit.protectedActions,
      ...finalAudit.protectedActions
    ]),
    reviewerFindings: uniqueFindings([
      ...draftAudit.reviewerFindings,
      ...finalAudit.reviewerFindings
    ]),
    humanApprovalRequired: uniqueStrings([
      ...draftAudit.humanApprovalRequired,
      ...finalAudit.humanApprovalRequired
    ]),
    openQuestions: uniqueStrings([
      ...draftAudit.openQuestions,
      ...finalAudit.openQuestions
    ])
  };
  const completed = new Date();

  const report = WorkflowReportSchema.parse({
    workflow: workflow.id,
    title: workflow.title,
    executiveSummary: [
      `Generated ${workflow.title} from ${input.path}.`,
      `Completed ${stepResults.length} agent steps in ${options.config.mock ? "mock" : "real"} mode.`
    ],
    evidence: [
      EvidenceItemSchema.parse({
        claim:
          "The report is based on the provided local input and generated specialist notes.",
        source: "local input file and workflow trace",
        confidence: "medium",
        needsConfirmation: true
      })
    ],
    risks: [
      RiskItemSchema.parse({
        risk:
          "Agent-generated claims may be incomplete or unsupported until checked by a human.",
        severity: "medium",
        mitigation:
          "Review the Facts And Sources and Open Questions sections before external use."
      })
    ],
    actionItems: [
      ActionItemSchema.parse({
        owner: "Human reviewer",
        task:
          "Verify sources, resolve open questions, and approve any protected external action.",
        priority: "high",
        due: "Before external use"
      })
    ],
    openQuestions: audit.openQuestions,
    humanApprovalRequired: audit.humanApprovalRequired,
    reviewerFindings: audit.reviewerFindings,
    markdown
  });

  const trace = TraceSummarySchema.parse({
    runId,
    workflow: workflow.id,
    workflowVersion: workflow.version,
    workflowConfigHash: workflow.configHash,
    agentPromptVersion: AGENT_PROMPT_VERSION,
    model: options.config.model,
    mock: options.config.mock,
    inputPath: input.path,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMs: completed.getTime() - started.getTime(),
    steps: stepResults.map((step) => ({
      label: step.label,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      durationMs: step.durationMs,
      outputPreview: step.output.slice(0, 500)
    })),
    reviewerFindings: audit.reviewerFindings
  });

  return { report, trace };
}

function taskBatches(tasks: WorkflowTask[]): WorkflowTask[][] {
  const batches: WorkflowTask[][] = [];
  let currentParallelGroup: string | undefined;
  let currentBatch: WorkflowTask[] = [];

  for (const task of tasks) {
    if (task.parallelGroup) {
      if (currentParallelGroup === task.parallelGroup) {
        currentBatch.push(task);
      } else {
        flushBatch();
        currentParallelGroup = task.parallelGroup;
        currentBatch = [task];
      }
      continue;
    }

    flushBatch();
    batches.push([task]);
  }

  flushBatch();
  return batches;

  function flushBatch(): void {
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentParallelGroup = undefined;
    }
  }
}

function buildTaskInput(
  workflow: WorkflowDefinition,
  input: InputDocument,
  task: WorkflowTask,
  previousSteps: AgentRunResult[]
): string {
  return [
    `Workflow: ${workflow.title}`,
    `Task: ${task.title}`,
    `Objective: ${task.objective}`,
    "",
    "Input document:",
    input.content,
    "",
    previousSteps.length > 0 ? "Previous agent notes:" : "Previous agent notes: none.",
    ...previousSteps.map((step) => `\n[${step.label}]\n${step.output}`)
  ].join("\n");
}

function buildManagerInput(
  workflow: WorkflowDefinition,
  input: InputDocument,
  steps: AgentRunResult[]
): string {
  return [
    `Workflow: ${workflow.title}`,
    workflow.description,
    "",
    "Original input:",
    input.content,
    "",
    "Specialist notes:",
    ...steps.map((step) => `\n[${step.label}]\n${step.output}`),
    "",
    "Write the final Markdown report now."
  ].join("\n");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function uniqueFindings(
  findings: Array<{ code: string; severity: string; message: string }>
) {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.code}:${finding.severity}:${finding.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
