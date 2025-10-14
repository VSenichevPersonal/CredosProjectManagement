import { z } from "zod"

export const evidenceTypeSchema = z.enum([
  "document",
  "screenshot",
  "log",
  "certificate",
  "report",
  "scan",
  "video",
  "audio",
  "archive",
  "other",
])

export const documentMetadataSchema = z.object({
  pages: z.number().optional(),
  language: z.string().optional(),
  author: z.string().optional(),
})

export const certificateMetadataSchema = z.object({
  issuer: z.string(),
  validUntil: z.string().or(z.date()),
  serialNumber: z.string(),
  algorithm: z.string().optional(),
})

export const screenshotMetadataSchema = z.object({
  resolution: z.string().optional(),
  capturedFrom: z.string().optional(),
  capturedAt: z.string().or(z.date()).optional(),
})

export const logMetadataSchema = z.object({
  logLevel: z.string().optional(),
  source: z.string().optional(),
  lineCount: z.number().optional(),
  dateRange: z
    .object({
      from: z.string().or(z.date()),
      to: z.string().or(z.date()),
    })
    .optional(),
})

export const reportMetadataSchema = z.object({
  reportType: z.string().optional(),
  period: z.string().optional(),
  generatedBy: z.string().optional(),
})

export const createEvidenceSchema = z.object({
  complianceRecordId: z.string().uuid().optional(),
  requirementId: z.string().uuid().optional(),
  controlId: z.string().uuid().optional(),
  fileName: z.string().min(1, "Имя файла обязательно"),
  fileUrl: z.string().url("Некорректный URL файла"),
  fileType: z.string().min(1, "Тип файла обязателен"),
  fileSize: z.number().positive("Размер файла должен быть положительным"),
  storagePath: z.string().optional(),
  evidenceType: evidenceTypeSchema.default("other"),
  evidenceTypeId: z.string().uuid().optional().nullable(),  // ⭐ ДОБАВЛЕНО!
  typeMetadata: z.record(z.unknown()).optional(),
  title: z.string().min(3, "Название должно содержать минимум 3 символа").optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const updateEvidenceSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["pending", "approved", "rejected", "archived"]).optional(),
  reviewNotes: z.string().optional(),
  controlId: z.string().uuid().optional(),
  evidenceType: evidenceTypeSchema.optional(),
  typeMetadata: z.record(z.unknown()).optional(),
})

export const evidenceFiltersSchema = z.object({
  complianceRecordId: z.string().uuid().optional(),
  requirementId: z.string().uuid().optional(),
  controlId: z.string().uuid().optional(),
  status: z.enum(["pending", "approved", "rejected", "archived"]).optional(),
  uploadedBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  evidenceType: evidenceTypeSchema.optional(),
})

export type CreateEvidenceDTO = z.infer<typeof createEvidenceSchema>
export type UpdateEvidenceDTO = z.infer<typeof updateEvidenceSchema>
export type EvidenceFiltersDTO = z.infer<typeof evidenceFiltersSchema>

export interface EvidenceDTO {
  id: string
  tenantId: string
  complianceRecordId?: string
  requirementId?: string
  controlId?: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  storagePath?: string
  evidenceType:
    | "document"
    | "screenshot"
    | "log"
    | "certificate"
    | "report"
    | "scan"
    | "video"
    | "audio"
    | "archive"
    | "other"
  typeMetadata?: Record<string, unknown>
  title?: string
  description?: string
  tags?: string[]
  status: "pending" | "approved" | "rejected" | "archived"
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  uploadedBy: string
  uploadedAt: string
  createdAt: string
  updatedAt: string
}
