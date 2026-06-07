import { z } from "zod";
import { ReviewFindingSchema } from "./report.js";

export const TraceStepSchema = z.object({
  label: z.string().min(1),
  startedAt: z.string().min(1),
  completedAt: z.string().min(1),
  durationMs: z.number().nonnegative(),
  outputPreview: z.string()
});

export const TraceSummarySchema = z.object({
  runId: z.string().min(1),
  workflow: z.string().min(1),
  model: z.string().min(1),
  mock: z.boolean(),
  inputPath: z.string().min(1),
  startedAt: z.string().min(1),
  completedAt: z.string().min(1),
  durationMs: z.number().nonnegative(),
  steps: z.array(TraceStepSchema),
  reviewerFindings: z.array(ReviewFindingSchema),
  reportPath: z.string().optional(),
  tracePath: z.string().optional()
});

export type TraceStep = z.infer<typeof TraceStepSchema>;
export type TraceSummary = z.infer<typeof TraceSummarySchema>;
