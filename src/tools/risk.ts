import type { ReviewFinding } from "../schemas/report.js";
import type { WorkflowDefinition } from "../workflows/types.js";

const PROTECTED_ACTION_PATTERNS = [
  /\bsend\s+(an?\s+)?(email|message|slack|sms)\b/i,
  /\bpublish\b/i,
  /\bdelete\b/i,
  /\bremove\b/i,
  /\bmerge\b/i,
  /\bdeploy\b/i,
  /\bcommit\b/i,
  /\bopen\s+(a\s+)?pull request\b/i,
  /\bcreate\s+(a\s+)?pr\b/i,
  /\bcharge\b/i,
  /\bbill\b/i
];

const SECTION_ALIASES: Record<string, RegExp[]> = {
  "Executive Summary": [/^##\s+Executive Summary\b/im],
  "Facts And Sources": [
    /^##\s+Facts And Sources\b/im,
    /^##\s+Sources\b/im,
    /^##\s+Evidence\b/im
  ],
  Risks: [/^##\s+Risks\b/im],
  "Action Items": [/^##\s+Action Items\b/im, /^##\s+Actions\b/im],
  "Human Approval Required": [
    /^##\s+Human Approval Required\b/im,
    /^##\s+Approval\b/im
  ],
  "Open Questions": [/^##\s+Open Questions\b/im, /^##\s+Questions\b/im]
};

export interface ReportAudit {
  missingSections: string[];
  protectedActions: string[];
  reviewerFindings: ReviewFinding[];
  humanApprovalRequired: string[];
  openQuestions: string[];
}

export function detectProtectedActions(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      PROTECTED_ACTION_PATTERNS.some((pattern) => pattern.test(line))
    );
}

export function reviewMarkdownReport(
  markdown: string,
  workflow: WorkflowDefinition
): ReportAudit {
  const missingSections = workflow.requiredSections.filter(
    (section) => !hasSection(markdown, section)
  );
  const protectedActions = detectProtectedActions(markdown);
  const reviewerFindings: ReviewFinding[] = [];

  for (const section of missingSections) {
    reviewerFindings.push({
      code: "missing_section",
      severity: "error",
      message: `Missing required section: ${section}.`
    });
  }

  if (!/(source|citation|confidence|http|local input)/i.test(markdown)) {
    reviewerFindings.push({
      code: "missing_sources",
      severity: "error",
      message:
        "The report does not clearly mark sources, citations, or confidence."
    });
  }

  if (!sectionHasBullet(markdown, "Action Items")) {
    reviewerFindings.push({
      code: "unclear_actions",
      severity: "warning",
      message: "Action items are missing or not written as clear bullets."
    });
  }

  if (!sectionHasBullet(markdown, "Risks")) {
    reviewerFindings.push({
      code: "missing_risks",
      severity: "warning",
      message: "Risks are missing or not written as clear bullets."
    });
  }

  if (protectedActions.length > 0) {
    reviewerFindings.push({
      code: "protected_actions",
      severity: "warning",
      message:
        "Protected external actions were mentioned and must stay behind human approval."
    });
  }

  const humanApprovalRequired = [
    ...workflow.approvalPolicy,
    ...protectedActions.map((line) => `Review protected action: ${line}`)
  ];

  const openQuestions =
    reviewerFindings.length > 0
      ? reviewerFindings.map((finding) => finding.message)
      : ["No blocking reviewer questions were detected."];

  return {
    missingSections,
    protectedActions,
    reviewerFindings,
    humanApprovalRequired,
    openQuestions
  };
}

export function ensureRequiredSections(
  markdown: string,
  workflow: WorkflowDefinition
): string {
  let output = markdown.trim();

  if (!/^#\s+/m.test(output)) {
    output = `# ${workflow.title}\n\n${output}`;
  }

  for (const section of workflow.requiredSections) {
    if (!hasSection(output, section)) {
      output += `\n\n## ${section}\n\n${fallbackSectionBody(section, workflow)}`;
    }
  }

  return `${output.trim()}\n`;
}

function hasSection(markdown: string, section: string): boolean {
  const aliases = SECTION_ALIASES[section] ?? [
    new RegExp(`^##\\s+${escapeRegExp(section)}\\b`, "im")
  ];
  return aliases.some((pattern) => pattern.test(markdown));
}

function sectionHasBullet(markdown: string, section: string): boolean {
  const aliases = SECTION_ALIASES[section] ?? [];
  const match = aliases
    .map((pattern) => pattern.exec(markdown))
    .find((result): result is RegExpExecArray => Boolean(result));

  if (!match) {
    return false;
  }

  const start = match.index + match[0].length;
  const nextHeading = markdown.slice(start).search(/^##\s+/m);
  const body =
    nextHeading === -1
      ? markdown.slice(start)
      : markdown.slice(start, start + nextHeading);

  return /^\s*[-*]\s+\S+/m.test(body);
}

function fallbackSectionBody(
  section: string,
  workflow: WorkflowDefinition
): string {
  switch (section) {
    case "Executive Summary":
      return "- Summary was not provided by the manager agent. Review the synthesis above.";
    case "Facts And Sources":
      return "- Claim: Output is based on the provided local input and agent notes. Source: local input file and workflow trace. Confidence: medium.";
    case "Risks":
      return "- Unsupported assumptions may remain until a human validates sources.";
    case "Action Items":
      return "- Owner: Human reviewer. Task: review the report for source coverage, clear actions, and approval needs. Priority: high.";
    case "Human Approval Required":
      return workflow.approvalPolicy.map((item) => `- ${item}`).join("\n");
    case "Open Questions":
      return "- Which source records should be treated as authoritative?";
    default:
      return "- Not provided.";
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
