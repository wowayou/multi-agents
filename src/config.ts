import "dotenv/config";

export const DEFAULT_MODEL = "gpt-5.5";

export interface RuntimeConfig {
  model: string;
  mock: boolean;
  outputDir: string;
  save: boolean;
}

export function loadRuntimeConfig(
  overrides: Partial<RuntimeConfig> = {}
): RuntimeConfig {
  const mock = overrides.mock ?? process.env.AGENT_WORKFLOWS_MOCK === "1";
  const model = overrides.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const outputDir =
    overrides.outputDir ?? process.env.AGENT_WORKFLOWS_OUT_DIR ?? "runs";
  const save = overrides.save ?? true;

  if (!mock && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required for real agent runs. Set AGENT_WORKFLOWS_MOCK=1 or pass --mock for a local preview."
    );
  }

  return { model, mock, outputDir, save };
}
