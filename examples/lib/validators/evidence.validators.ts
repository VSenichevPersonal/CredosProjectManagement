import { z } from "zod"

export const createEvidenceSchema = z.object({
  complianceId: z.string().uuid("Некорректный ID статуса выполнения"),
  fileName: z.string().min(1, "Имя файла обязательно"),
  fileUrl: z.string().url("Некорректный URL файла"),
  fileSize: z.number().positive("Размер файла должен быть положительным"),
  fileType: z.string().min(1, "Тип файла обязателен"),
  description: z.string().optional(),
})

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>
