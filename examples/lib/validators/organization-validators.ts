/**
 * @intent: Validation schemas for organization operations
 * @llm-note: Runtime validation with Zod for type safety
 */

import { z } from "zod"

export const createOrganizationSchema = z.object({
  name: z.string().min(3, "Название должно содержать минимум 3 символа").max(200, "Название слишком длинное"),
  shortName: z
    .string()
    .min(2, "Краткое название должно содержать минимум 2 символа")
    .max(50, "Краткое название слишком длинное"),
  type: z.enum(["regulator", "ministry", "institution"], {
    errorMap: () => ({ message: "Неверный тип организации" }),
  }),
  parentId: z.string().uuid("Неверный формат ID родительской организации").optional(),
  level: z.number().int().min(1).max(3, "Уровень должен быть от 1 до 3"),
  inn: z
    .string()
    .regex(/^\d{10}$|^\d{12}$/, "ИНН должен содержать 10 или 12 цифр")
    .optional(),
  ogrn: z
    .string()
    .regex(/^\d{13}$|^\d{15}$/, "ОГРН должен содержать 13 или 15 цифр")
    .optional(),
  address: z.string().optional(),
  contactEmail: z.string().email("Неверный формат email").optional(),
  contactPhone: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/, "Неверный формат телефона")
    .optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  shortName: z.string().min(2).max(50).optional(),
  inn: z
    .string()
    .regex(/^\d{10}$|^\d{12}$/)
    .optional(),
  ogrn: z
    .string()
    .regex(/^\d{13}$|^\d{15}$/)
    .optional(),
  address: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/)
    .optional(),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
