import { Agent } from "@openai/agents";
import {
  specialistMetadata,
  type SpecialistAgents
} from "./definitions.js";
import type { WorkflowDefinition } from "../workflows/types.js";

export function createWorkflowManager(
  workflow: WorkflowDefinition,
  specialists: SpecialistAgents,
  model: string
) {
  const tools = workflow.specialists.map((key) =>
    specialists[key].asTool({
      toolName: `${key}_agent`,
      toolDescription: specialistMetadata[key].description
    })
  );

  return new Agent({
    name: `${workflow.title} Manager`,
    model,
    instructions: [
      "You are the manager agent for a work operations workflow.",
      "Use specialist tools when useful, but produce exactly one final answer.",
      "Never perform external side effects. Do not send, publish, delete, merge, deploy, commit, or open pull requests.",
      `Workflow: ${workflow.title}`,
      workflow.managerPrompt,
      "The final Markdown report must include: Executive Summary, Facts And Sources, Risks, Action Items, Human Approval Required, Open Questions.",
      "For every important factual claim, include a source label and confidence. If the source is only the provided input, say so."
    ].join("\n\n"),
    tools
  });
}
