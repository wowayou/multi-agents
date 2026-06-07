import { z } from "zod";

export const AdoptionSchema = z.enum(["yes", "partial", "no", "unknown"]);

export const RunEvaluationRecordSchema = z.object({
  runId: z.string().min(1),
  workflow: z.string().min(1),
  tracePath: z.string().min(1),
  evaluatedAt: z.string().min(1),
  estimatedMinutesBefore: z.number().nonnegative().optional(),
  actualMinutesAfter: z.number().nonnegative().optional(),
  timeSavedMinutes: z.number().optional(),
  adopted: AdoptionSchema.default("unknown"),
  errors: z.array(z.string().min(1)).default([]),
  rework: z.array(z.string().min(1)).default([]),
  notes: z.array(z.string().min(1)).default([])
});

export type Adoption = z.infer<typeof AdoptionSchema>;
export type RunEvaluationRecord = z.infer<typeof RunEvaluationRecordSchema>;
