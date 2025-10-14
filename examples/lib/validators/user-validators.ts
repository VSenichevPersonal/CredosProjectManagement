/**
 * @intent: Validation schemas for user operations
 * @llm-note: Runtime validation with Zod for type safety
 */

import { z } from "zod"

export const createUserSchema = z.object({
  email: z.string().email("Неверный формат email"),
  fullName: z.string().min(2, "Имя должно содержать минимум 2 символа").max(100, "Имя слишком длинное"),
  role: z.enum(["super_admin", "regulator_admin", "ministry_user", "institution_user", "ciso", "auditor"], {
    errorMap: () => ({ message: "Неверная роль пользователя" }),
  }),
  organizationId: z.string().uuid("Неверный формат ID организации"),
  isActive: z.boolean().optional().default(true),
})

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(["super_admin", "regulator_admin", "ministry_user", "institution_user", "ciso", "auditor"]).optional(),
  organizationId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
    newPassword: z
      .string()
      .min(8, "Новый пароль должен содержать минимум 8 символов")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Пароль должен содержать заглавные и строчные буквы, а также цифры"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
