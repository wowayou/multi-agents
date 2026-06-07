import { run } from "@openai/agents";

export type SdkAgent = Parameters<typeof run>[0];

export interface AgentRunResult {
  label: string;
  output: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface AgentRunner {
  runAgent(agent: SdkAgent, input: string, label: string): Promise<AgentRunResult>;
}

export class OpenAIAgentsRunner implements AgentRunner {
  async runAgent(
    agent: SdkAgent,
    input: string,
    label: string
  ): Promise<AgentRunResult> {
    const started = new Date();
    const result = await run(agent, input);
    const completed = new Date();

    return {
      label,
      output: normalizeAgentOutput(
        (result as { finalOutput?: unknown }).finalOutput ?? result
      ),
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime()
    };
  }
}

export class LocalPreviewRunner implements AgentRunner {
  async runAgent(
    _agent: SdkAgent,
    input: string,
    label: string
  ): Promise<AgentRunResult> {
    const started = new Date();
    const output = buildLocalPreviewOutput(label, input);
    const completed = new Date();

    return {
      label,
      output,
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime()
    };
  }
}

export function normalizeAgentOutput(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === undefined || value === null) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

function buildLocalPreviewOutput(label: string, input: string): string {
  const excerpt = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join(" / ");

  if (label === "manager") {
    return [
      "# Local Preview Report",
      "",
      "## Executive Summary",
      "- This deterministic preview shows the expected report shape without calling the OpenAI API.",
      `- Input signal: ${excerpt || "No input excerpt available."}`,
      "",
      "## Facts And Sources",
      "- Claim: The report is based on the provided local input and generated specialist notes. Source: local input file and workflow trace. Confidence: medium.",
      "",
      "## Risks",
      "- Generated content may contain unsupported assumptions until a human checks sources.",
      "- Any external communication, publication, deployment, deletion, or repository action requires approval.",
      "",
      "## Action Items",
      "- Owner: Human reviewer. Task: Verify source coverage and approve or reject any external action. Priority: high.",
      "",
      "## Human Approval Required",
      "- Review factual claims before sharing the report externally.",
      "- Approve any send, publish, delete, merge, deploy, commit, or pull request action manually.",
      "",
      "## Open Questions",
      "- Which source links or internal records should be treated as authoritative?"
    ].join("\n");
  }

  return [
    `## ${label}`,
    "",
    `- Local preview for ${label}.`,
    `- Input excerpt: ${excerpt || "No input excerpt available."}`,
    "- Source: local input file. Confidence: medium.",
    "- Needs human confirmation before external use."
  ].join("\n");
}
