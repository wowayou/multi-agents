import { contentOpsWorkflow } from "./content-ops.js";
import { meetingActionsWorkflow } from "./meeting-actions.js";
import { opsWeeklyWorkflow } from "./ops-weekly.js";
import { researchReportWorkflow } from "./research-report.js";
import type { WorkflowDefinition, WorkflowId } from "./types.js";

export const workflows: Record<WorkflowId, WorkflowDefinition> = {
  "research-report": researchReportWorkflow,
  "ops-weekly": opsWeeklyWorkflow,
  "meeting-actions": meetingActionsWorkflow,
  "content-ops": contentOpsWorkflow
};

export function listWorkflows(): WorkflowDefinition[] {
  return Object.values(workflows);
}

export function resolveWorkflow(id: string): WorkflowDefinition {
  if (id in workflows) {
    return workflows[id as WorkflowId];
  }

  const known = Object.keys(workflows).join(", ");
  throw new Error(`Unknown workflow "${id}". Known workflows: ${known}.`);
}
