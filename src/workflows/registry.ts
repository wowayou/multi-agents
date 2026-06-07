import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { ZodError } from "zod";
import { WorkflowConfigSchema } from "./config-schema.js";
import type { WorkflowDefinition } from "./types.js";

const DEFAULT_WORKFLOW_CONFIG_DIR = path.resolve(
  process.cwd(),
  "config",
  "workflows"
);

export function getWorkflowConfigDir(): string {
  return process.env.AGENT_WORKFLOWS_CONFIG_DIR ?? DEFAULT_WORKFLOW_CONFIG_DIR;
}

export function loadWorkflowDefinitions(
  configDir = getWorkflowConfigDir()
): WorkflowDefinition[] {
  if (!existsSync(configDir)) {
    throw new Error(`Workflow config directory not found: ${configDir}`);
  }

  const files = readdirSync(configDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No workflow config JSON files found in: ${configDir}`);
  }

  const workflows = files.map((file) =>
    readWorkflowConfigFile(path.join(configDir, file))
  );
  const ids = new Set<string>();

  for (const workflow of workflows) {
    if (ids.has(workflow.id)) {
      throw new Error(`Duplicate workflow id "${workflow.id}" in ${configDir}.`);
    }
    ids.add(workflow.id);
  }

  return workflows.sort((left, right) => left.id.localeCompare(right.id));
}

export function listWorkflows(configDir?: string): WorkflowDefinition[] {
  return loadWorkflowDefinitions(configDir);
}

export function resolveWorkflow(
  id: string,
  configDir?: string
): WorkflowDefinition {
  const workflows = loadWorkflowDefinitions(configDir);
  const workflow = workflows.find((candidate) => candidate.id === id);
  if (workflow) {
    return workflow;
  }

  const known = workflows.map((candidate) => candidate.id).join(", ");
  throw new Error(`Unknown workflow "${id}". Known workflows: ${known}.`);
}

export function validateWorkflowConfigs(configDir?: string): WorkflowDefinition[] {
  return loadWorkflowDefinitions(configDir);
}

function readWorkflowConfigFile(filePath: string): WorkflowDefinition {
  try {
    const raw = readFileSync(filePath, "utf8");
    const configHash = createHash("sha256")
      .update(raw)
      .digest("hex")
      .slice(0, 12);
    const workflow = WorkflowConfigSchema.parse(JSON.parse(raw));
    return {
      ...workflow,
      configHash
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${filePath}: invalid JSON: ${error.message}`);
    }

    if (error instanceof ZodError) {
      throw new Error(formatWorkflowConfigError(filePath, error));
    }

    throw error;
  }
}

function formatWorkflowConfigError(filePath: string, error: ZodError): string {
  const issues = error.issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `- ${filePath}: ${field}: ${issue.message}`;
    })
    .join("\n");

  return `Workflow config validation failed:\n${issues}`;
}
