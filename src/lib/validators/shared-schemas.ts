import { z } from 'zod';

// ============================================================================
// Shared Validation Schemas
// ============================================================================

// Direction schema
export const directionSchema = z.object({
  name: z.string()
    .min(1, "Название обязательно")
    .max(200, "Название не может быть длиннее 200 символов"),
  code: z.string()
    .max(50, "Код не может быть длиннее 50 символов")
    .optional(),
  description: z.string()
    .max(1000, "Описание не может быть длиннее 1000 символов")
    .optional(),
  budget: z.number()
    .min(0, "Бюджет не может быть отрицательным")
    .optional(),
});

export const updateDirectionSchema = directionSchema.partial();

// Employee schema
export const employeeSchema = z.object({
  fullName: z.string()
    .min(1, "ФИО обязательно")
    .max(200, "ФИО не может быть длиннее 200 символов"),
  email: z.string()
    .email("Неверный формат email"),
  phone: z.string()
    .max(50, "Телефон не может быть длиннее 50 символов")
    .optional(),
  position: z.string()
    .min(1, "Должность обязательна")
    .max(200, "Должность не может быть длиннее 200 символов"),
  directionId: z.string()
    .uuid("Неверный ID направления"),
  defaultHourlyRate: z.number()
    .min(0, "Ставка не может быть отрицательной")
    .optional(),
});

export const updateEmployeeSchema = employeeSchema.partial();

// Project schema
export const projectSchema = z.object({
  name: z.string()
    .min(1, "Название обязательно")
    .max(200, "Название не может быть длиннее 200 символов"),
  code: z.string()
    .max(50, "Код не может быть длиннее 50 символов")
    .optional(),
  description: z.string()
    .max(2000, "Описание не может быть длиннее 2000 символов")
    .optional(),
  directionId: z.string()
    .uuid("Неверный ID направления"),
  managerId: z.string()
    .uuid("Неверный ID менеджера")
    .optional(),
  startDate: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Неверная дата начала"),
  endDate: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Неверная дата окончания"),
  budget: z.number()
    .min(0, "Бюджет не может быть отрицательным")
    .optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
    .default('planning'),
});

export const updateProjectSchema = projectSchema.partial();

// Task schema
export const taskSchema = z.object({
  title: z.string()
    .min(1, "Название обязательно")
    .max(200, "Название не может быть длиннее 200 символов"),
  description: z.string()
    .max(2000, "Описание не может быть длиннее 2000 символов")
    .optional(),
  projectId: z.string()
    .uuid("Неверный ID проекта"),
  assigneeId: z.string()
    .uuid("Неверный ID исполнителя")
    .optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled'])
    .default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'critical'])
    .default('medium'),
  estimatedHours: z.number()
    .min(0, "Оценка не может быть отрицательной")
    .optional(),
  dueDate: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Неверная дата"),
});

export const updateTaskSchema = taskSchema.partial();

// Time Entry schema
export const timeEntrySchema = z.object({
  employeeId: z.string()
    .uuid("Неверный ID сотрудника"),
  projectId: z.string()
    .uuid("Неверный ID проекта"),
  taskId: z.string()
    .uuid("Неверный ID задачи")
    .optional(),
  date: z.string()
    .refine((val) => !isNaN(Date.parse(val)), "Неверная дата"),
  hours: z.number()
    .min(0.1, "Минимум 0.1 часа")
    .max(24, "Максимум 24 часа"),
  description: z.string()
    .max(500, "Описание не может быть длиннее 500 символов")
    .optional(),
});

export const updateTimeEntrySchema = timeEntrySchema.partial();

// ============================================================================
// Type exports
// ============================================================================

export type DirectionInput = z.infer<typeof directionSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TimeEntryInput = z.infer<typeof timeEntrySchema>;

