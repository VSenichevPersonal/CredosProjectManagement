/**
 * DTOs для работы с документами
 */

import { z } from "zod"
import type { DocumentLifecycle, ConfidentialityLevel, WorkflowType } from "../domain/document-type"

// =====================================================
// ZOD SCHEMAS
// =====================================================

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  documentTypeId: z.string().optional(),
  templateId: z.string().optional(),
  
  documentNumber: z.string().optional(),
  documentDate: z.string().or(z.date()).optional(),
  
  organizationId: z.string().optional(),
  ownerId: z.string().optional(),
  
  retentionPeriodYears: z.number().optional(),
  validityPeriodDays: z.number().optional(),
  
  confidentialityLevel: z.string().optional(),
  
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(0),
  storagePath: z.string().min(1, "Storage path is required"),
  
  versionNumber: z.string().optional(),
  changeSummary: z.string().optional(),
  
  autoApprove: z.boolean().optional(),
  approvers: z.array(z.string()).optional(),
})

// =====================================================
// DOCUMENT DTOs
// =====================================================

export interface CreateDocumentDTO {
  title: string
  description?: string
  documentTypeId: string
  templateId?: string
  
  // Реквизиты
  documentNumber?: string
  documentDate?: Date | string
  
  // Владение
  organizationId?: string
  ownerId?: string
  
  // Сроки (можно переопределить defaults из document_type)
  retentionPeriodYears?: number
  validityPeriodDays?: number
  
  // Конфиденциальность
  confidentialityLevel?: ConfidentialityLevel
  
  // Файл (первая версия)
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  storagePath: string
  
  // Опции
  autoApprove?: boolean
  approvers?: string[]
}

export interface UpdateDocumentDTO {
  title?: string
  description?: string
  documentNumber?: string
  documentDate?: Date | string
  ownerId?: string
  confidentialityLevel?: ConfidentialityLevel
}

export interface CreateDocumentFromTemplateDTO {
  templateId: string
  documentTypeId: string
  organizationId?: string
  
  // Customizations
  customizations?: {
    organizationName?: string
    responsiblePerson?: string
    effectiveDate?: string
    [key: string]: any
  }
  
  // Auto-linking
  autoUseAsEvidence?: boolean
  complianceRecordId?: string
  controlMeasureIds?: string[]
}

// =====================================================
// EVIDENCE с DOCUMENT DTOs
// =====================================================

export interface CreateEvidenceWithDocumentDTO {
  // Вариант 1: Использовать существующий документ
  documentId?: string
  
  // Вариант 2: Загрузить файл
  file?: {
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    storagePath: string
  }
  
  // Вариант 3: Создать новый документ
  createDocument?: CreateDocumentDTO
  
  // Evidence metadata
  evidenceTypeId: string
  title?: string
  description?: string
  tags?: string[]
  
  // Linking
  complianceRecordId?: string
  requirementId?: string
  controlMeasureIds?: string[]
}

// =====================================================
// APPROVAL DTOs
// =====================================================

export interface StartApprovalDTO {
  documentId: string
  versionId?: string
  approvers: string[]  // User IDs
  workflowType?: WorkflowType
  dueDate?: Date | string
}

export interface ApproveStepDTO {
  stepId: string
  comments?: string
}

export interface RejectStepDTO {
  stepId: string
  reason: string
}

// =====================================================
// RECOMMENDATION DTOs
// =====================================================

export interface RequirementDocumentTemplate {
  id: string
  requirementId: string
  templateId: string
  documentTypeId?: string
  
  isRecommended: boolean
  priority: number
  
  usageInstructions?: string
  customizationNotes?: string
  
  autoCreateOnCompliance: boolean
  suggestedControlTemplateIds?: string[]
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  template?: {
    id: string
    title: string
    description?: string
    fileUrl: string
    fileType: string
  }
  documentType?: {
    id: string
    code: string
    name: string
    icon?: string
  }
}

export interface CreateRequirementDocumentTemplateDTO {
  requirementId: string
  templateId: string
  documentTypeId?: string
  priority?: number
  usageInstructions?: string
  autoCreateOnCompliance?: boolean
  suggestedControlTemplateIds?: string[]
}

// =====================================================
// QUERY FILTERS
// =====================================================

export interface DocumentFilters {
  documentTypeId?: string
  lifecycleStatus?: DocumentLifecycle | DocumentLifecycle[]
  organizationId?: string
  ownerId?: string
  confidentialityLevel?: ConfidentialityLevel
  search?: string
  effectiveDateFrom?: Date
  effectiveDateTo?: Date
  needsReview?: boolean  // next_review_date <= NOW + 14 days
}
