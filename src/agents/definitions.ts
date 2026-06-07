import { Agent } from "@openai/agents";

export const AGENT_PROMPT_VERSION = "2026-06-08";

export const specialistAgentKeys = [
  "researcher",
  "factChecker",
  "contrarianReviewer",
  "opsAnalyst",
  "meetingAnalyst",
  "contentStrategist",
  "riskReviewer",
  "synthesizer"
] as const;

export type SpecialistAgentKey = (typeof specialistAgentKeys)[number];

export interface SpecialistMetadata {
  key: SpecialistAgentKey;
  name: string;
  description: string;
  instructions: string;
}

export const specialistMetadata: Record<SpecialistAgentKey, SpecialistMetadata> =
  {
    researcher: {
      key: "researcher",
      name: "Researcher",
      description:
        "Collects relevant facts, evidence, uncertainties, and source notes.",
      instructions:
        "You are a rigorous research agent. Extract facts from the provided input, separate evidence from assumptions, cite source names or local input sections, and assign confidence as low, medium, or high. Do not invent external citations."
    },
    factChecker: {
      key: "factChecker",
      name: "Fact Checker",
      description:
        "Checks source coverage, unsupported claims, contradictions, and confidence.",
      instructions:
        "You are a fact-checking agent. Identify claims that need evidence, mark unsupported statements, note contradictions, and list specific questions that need human verification."
    },
    contrarianReviewer: {
      key: "contrarianReviewer",
      name: "Contrarian Reviewer",
      description:
        "Challenges assumptions and looks for reasons the recommendation may fail.",
      instructions:
        "You are a contrarian reviewer. Challenge the main recommendation, identify missing context, list failure modes, and recommend what would change your mind."
    },
    opsAnalyst: {
      key: "opsAnalyst",
      name: "Operations Analyst",
      description:
        "Summarizes progress, metrics, blockers, and next operational moves.",
      instructions:
        "You are an operations analyst. Convert weekly notes into progress themes, metrics, blockers, owner-ready actions, and a short executive summary."
    },
    meetingAnalyst: {
      key: "meetingAnalyst",
      name: "Meeting Analyst",
      description:
        "Extracts decisions, action items, owners, dependencies, and risks from meeting notes.",
      instructions:
        "You are a meeting analyst. Extract decisions, action items, owners if present, missing owners, deadlines, blockers, and risks. Never assume an owner when the input does not provide one."
    },
    contentStrategist: {
      key: "contentStrategist",
      name: "Content Strategist",
      description:
        "Turns briefs into angles, outlines, draft notes, and review concerns.",
      instructions:
        "You are a content operations agent. Develop the topic angle, outline the draft, list evidence needs, flag unsupported claims, and keep publication actions behind human approval."
    },
    riskReviewer: {
      key: "riskReviewer",
      name: "Risk Reviewer",
      description:
        "Finds operational, reputational, legal, and execution risks.",
      instructions:
        "You are a risk reviewer. Identify risks, protected actions, irreversible steps, missing approvals, and actions that must be reviewed by a human before execution."
    },
    synthesizer: {
      key: "synthesizer",
      name: "Synthesizer",
      description:
        "Combines specialist notes into one final Markdown report.",
      instructions:
        "You are a synthesis agent. Produce one clear Markdown report with these sections: Executive Summary, Facts And Sources, Risks, Action Items, Human Approval Required, Open Questions. Preserve uncertainties and do not hide reviewer concerns."
    }
  };

export function createSpecialistAgents(model: string) {
  return {
    researcher: new Agent({
      name: specialistMetadata.researcher.name,
      model,
      instructions: specialistMetadata.researcher.instructions
    }),
    factChecker: new Agent({
      name: specialistMetadata.factChecker.name,
      model,
      instructions: specialistMetadata.factChecker.instructions
    }),
    contrarianReviewer: new Agent({
      name: specialistMetadata.contrarianReviewer.name,
      model,
      instructions: specialistMetadata.contrarianReviewer.instructions
    }),
    opsAnalyst: new Agent({
      name: specialistMetadata.opsAnalyst.name,
      model,
      instructions: specialistMetadata.opsAnalyst.instructions
    }),
    meetingAnalyst: new Agent({
      name: specialistMetadata.meetingAnalyst.name,
      model,
      instructions: specialistMetadata.meetingAnalyst.instructions
    }),
    contentStrategist: new Agent({
      name: specialistMetadata.contentStrategist.name,
      model,
      instructions: specialistMetadata.contentStrategist.instructions
    }),
    riskReviewer: new Agent({
      name: specialistMetadata.riskReviewer.name,
      model,
      instructions: specialistMetadata.riskReviewer.instructions
    }),
    synthesizer: new Agent({
      name: specialistMetadata.synthesizer.name,
      model,
      instructions: specialistMetadata.synthesizer.instructions
    })
  };
}

export type SpecialistAgents = ReturnType<typeof createSpecialistAgents>;
