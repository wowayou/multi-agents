import type { SpecialistAgentKey } from "../agents/definitions.js";

export type WorkflowId = string;

export interface WorkflowTask {
  id: string;
  title: string;
  agent: SpecialistAgentKey;
  objective: string;
  parallelGroup?: string;
}

export interface WorkflowDefinition {
  id: WorkflowId;
  version: string;
  title: string;
  description: string;
  inputHint: string;
  specialists: SpecialistAgentKey[];
  tasks: WorkflowTask[];
  managerPrompt: string;
  requiredSections: string[];
  approvalPolicy: string[];
  configHash?: string;
}
