import { z } from "zod"

export const createRequirementSchema = z.object({
  code: z
    .string()
    .min(3, "Код должен содержать минимум 3 символа")
    .max(20, "Код не может быть длиннее 20 символов")
    .regex(/^[А-ЯA-Zа-яa-z0-9-]+$/, "Код может содержать только буквы, цифры и дефис"),
  title: z
    .string()
    .min(5, "Название должно содержать минимум 5 символов")
    .max(200, "Название не может быть длиннее 200 символов"),
  description: z.string().min(1, "Описание обязательно"),
  categoryId: z.string().uuid().optional().nullable(),
  criticality: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  regulatorId: z.string().uuid().optional().nullable(),
  regulatoryFrameworkId: z.string().uuid().optional().nullable(),
  periodicityId: z.string().uuid().optional().nullable(),
  verificationMethodId: z.string().uuid().optional().nullable(),
  responsibleRoleId: z.string().uuid().optional().nullable(),
  documentId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  effectiveDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
})

export const updateRequirementSchema = z.object({
  code: z.string().min(3).max(20).optional(),
  title: z.string().min(5).max(200).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  criticality: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  regulatorId: z.string().uuid().optional().nullable(),
  regulatoryFrameworkId: z.string().uuid().optional().nullable(),
  periodicityId: z.string().uuid().optional().nullable(),
  verificationMethodId: z.string().uuid().optional().nullable(),
  responsibleRoleId: z.string().uuid().optional().nullable(),
  documentId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  effectiveDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
})

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>
