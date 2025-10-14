/**
 * @intent: Validation schemas for project operations in Credos PM
 * @llm-note: Runtime validation with Zod for type safety
 */

import { z } from "zod"

export const createProjectSchema = z.object({
  name: z.string().min(3, "Название должно содержать минимум 3 символа").max(200, "Название слишком длинное"),
  description: z.string().max(1000, "Описание слишком длинное").optional(),
  directionId: z.string().uuid("Неверный формат ID направления"),
  managerId: z.string().uuid("Неверный формат ID менеджера"),
  clientName: z.string().min(1, "Название клиента обязательно").max(200, "Название клиента слишком длинное"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Неверный формат даты начала"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Неверный формат даты окончания").optional(),
  budget: z.number().positive("Бюджет должен быть положительным").optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
  type: z.enum(["implementation", "setup", "documentation", "presale"]).default("implementation"),
})

export const updateProjectSchema = z.object({
  name: z.string().min(3, "Название должно содержать минимум 3 символа").max(200, "Название слишком длинное").optional(),
  description: z.string().max(1000, "Описание слишком длинное").optional(),
  managerId: z.string().uuid("Неверный формат ID менеджера").optional(),
  clientName: z.string().min(1, "Название клиента обязательно").max(200, "Название клиента слишком длинное").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Неверный формат даты начала").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Неверный формат даты окончания").optional(),
  budget: z.number().positive("Бюджет должен быть положительным").optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
  type: z.enum(["implementation", "setup", "documentation", "presale"]).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
