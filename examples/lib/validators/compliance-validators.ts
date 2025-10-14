import { z } from "zod"

export const updateComplianceSchema = z.object({
  status: z
    .enum([
      "pending",
      "compliant",
      "non_compliant",
      "partial",
      "not_applicable",
      "in_progress",
      "not_started",
      "pending_review",
      "approved",
      "rejected",
    ])
    .optional(),
  assignedTo: z.string().uuid().optional(),
  comments: z.string().optional(),
  notes: z.string().optional(),
  completedAt: z.string().optional(),
  nextReviewDate: z.string().optional(),
  notifyReviewer: z.boolean().optional(),
  rejectionReason: z.string().optional(),
})

export const createComplianceSchema = z.object({
  requirementId: z.string().uuid("Неверный формат ID требования"),
  organizationId: z.string().uuid("Неверный формат ID организации"),
  assignedTo: z.string().uuid("Неверный формат ID пользователя").optional(),
  status: z
    .enum([
      "pending",
      "compliant",
      "non_compliant",
      "partial",
      "not_applicable",
      "in_progress",
      "not_started",
      "pending_review",
      "approved",
      "rejected",
    ])
    .optional()
    .default("pending"),
})

export const reviewComplianceSchema = z.object({
  decision: z.enum(["compliant", "non_compliant"], {
    errorMap: () => ({ message: "Решение должно быть 'compliant' или 'non_compliant'" }),
  }),
  comment: z.string().min(10, "Комментарий должен содержать минимум 10 символов").optional(),
})

export const assignRequirementSchema = z.object({
  requirementId: z.string().uuid("Неверный формат ID требования"),
  organizationIds: z.array(z.string().uuid()).min(1, "Укажите хотя бы одну организацию"),
})

export type UpdateComplianceInput = z.infer<typeof updateComplianceSchema>
export type CreateComplianceInput = z.infer<typeof createComplianceSchema>
export type ReviewComplianceInput = z.infer<typeof reviewComplianceSchema>
export type AssignRequirementInput = z.infer<typeof assignRequirementSchema>
