import { z } from "zod";

export const ConfidenceSchema = z.enum(["low", "medium", "high"]);

export const EvidenceItemSchema = z.object({
  claim: z.string().min(1),
  source: z.string().min(1),
  confidence: ConfidenceSchema,
  needsConfirmation: z.boolean().default(false)
});

export const RiskItemSchema = z.object({
  risk: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  mitigation: z.string().min(1)
});

export const ActionItemSchema = z.object({
  owner: z.string().min(1),
  task: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  due: z.string().optional()
});

export const ReviewFindingSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  message: z.string().min(1)
});

export const WorkflowReportSchema = z.object({
  workflow: z.string().min(1),
  title: z.string().min(1),
  executiveSummary: z.array(z.string().min(1)).min(1),
  evidence: z.array(EvidenceItemSchema).min(1),
  risks: z.array(RiskItemSchema),
  actionItems: z.array(ActionItemSchema),
  openQuestions: z.array(z.string().min(1)),
  humanApprovalRequired: z.array(z.string().min(1)),
  reviewerFindings: z.array(ReviewFindingSchema),
  markdown: z.string().min(1)
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type RiskItem = z.infer<typeof RiskItemSchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type ReviewFinding = z.infer<typeof ReviewFindingSchema>;
export type WorkflowReport = z.infer<typeof WorkflowReportSchema>;
