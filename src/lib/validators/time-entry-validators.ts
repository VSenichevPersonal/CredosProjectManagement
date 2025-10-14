/**
 * @intent: Validation schemas for time entry operations in Credos PM
 * @llm-note: Runtime validation with Zod for type safety
 */

import { z } from "zod"

export const createTimeEntrySchema = z.object({
  projectId: z.string().uuid("Неверный формат ID проекта"),
  taskId: z.string().uuid("Неверный формат ID задачи").optional(),
  employeeId: z.string().uuid("Неверный формат ID сотрудника"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Неверный формат даты (YYYY-MM-DD)"),
  hours: z.number().min(0.5, "Минимум 0.5 часа").max(24, "Максимум 24 часа в день"),
  description: z.string().min(1, "Описание обязательно").max(500, "Описание слишком длинное"),
  billable: z.boolean().optional().default(true),
})

export const updateTimeEntrySchema = z.object({
  hours: z.number().min(0.5, "Минимум 0.5 часа").max(24, "Максимум 24 часа в день").optional(),
  description: z.string().min(1, "Описание обязательно").max(500, "Описание слишком длинное").optional(),
  billable: z.boolean().optional(),
})

export const bulkTimeEntrySchema = z.object({
  entries: z.array(createTimeEntrySchema).min(1, "Должна быть хотя бы одна запись"),
})

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>
export type BulkTimeEntryInput = z.infer<typeof bulkTimeEntrySchema>
