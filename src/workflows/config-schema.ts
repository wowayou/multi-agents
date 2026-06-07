import { z } from "zod";
import { specialistAgentKeys } from "../agents/definitions.js";

export const WorkflowTaskConfigSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    agent: z.enum(specialistAgentKeys),
    objective: z.string().min(1),
    parallelGroup: z.string().min(1).optional()
  })
  .strict();

export const WorkflowConfigSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(
        /^[a-z0-9][a-z0-9-]*$/,
        "Use lowercase letters, numbers, and hyphens."
      ),
    title: z.string().min(1),
    description: z.string().min(1),
    inputHint: z.string().min(1),
    specialists: z.array(z.enum(specialistAgentKeys)).min(1),
    tasks: z.array(WorkflowTaskConfigSchema).min(1),
    managerPrompt: z.string().min(1),
    requiredSections: z.array(z.string().min(1)).min(1),
    approvalPolicy: z.array(z.string().min(1)).min(1)
  })
  .strict()
  .superRefine((workflow, context) => {
    const specialists = new Set(workflow.specialists);

    if (specialists.size !== workflow.specialists.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specialists"],
        message: "Specialists must be unique."
      });
    }

    const taskIds = new Set<string>();
    workflow.tasks.forEach((task, index) => {
      if (!specialists.has(task.agent)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tasks", index, "agent"],
          message: `"${task.agent}" must be listed in specialists.`
        });
      }

      if (taskIds.has(task.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tasks", index, "id"],
          message: `Duplicate task id "${task.id}".`
        });
      }
      taskIds.add(task.id);
    });

    const requiredSections = new Set(workflow.requiredSections);
    if (requiredSections.size !== workflow.requiredSections.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiredSections"],
        message: "Required sections must be unique."
      });
    }
  });

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
