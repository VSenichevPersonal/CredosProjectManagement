/**
 * @intent: Domain types for Document Types (типы документов)
 * @llm-note: Classification of documents with requirements and defaults
 * @architecture: Reference data for document management system
 */

export type DocumentCategory = 'organizational' | 'technical' | 'regulatory'

export type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'dsp' | 'trade_secret'

export interface DocumentType {
  id: string
  tenantId?: string  // NULL = глобальный тип
  
  // Идентификация
  code: string
  name: string
  description?: string
  category: DocumentCategory
  
  // Российская специфика
  regulator?: string           // ФСТЭК, Роскомнадзор, ФСБ, ЦБ РФ
  requirementCategory?: string  // КИИ, ПДн, ГИС, Криптография
  
  // Требования к документу
  requiresApproval: boolean
  requiresRegistration: boolean
  requiresNumber: boolean
  requiresDate: boolean
  requiresSignature: boolean
  requiresStamp: boolean
  
  // Сроки по умолчанию
  defaultRetentionYears?: number    // 3, 5, 10, 75, NULL=постоянно
  retentionNote?: string             // Основание для срока
  defaultValidityMonths?: number     // Срок действия
  defaultReviewMonths?: number       // Периодичность пересмотра
  
  // UI
  icon?: string
  color?: string
  sortOrder: number
  isActive: boolean
  
  // Связь с evidence_types
  defaultEvidenceTypeId?: string
  
  // Audit
  createdAt: Date
  updatedAt: Date
}

// DTOs
export interface CreateDocumentTypeDTO {
  code: string
  name: string
  description?: string
  category: DocumentCategory
  regulator?: string
  requirementCategory?: string
  requiresApproval?: boolean
  requiresNumber?: boolean
  defaultRetentionYears?: number
  defaultValidityMonths?: number
  defaultReviewMonths?: number
  icon?: string
  color?: string
}

export interface UpdateDocumentTypeDTO {
  name?: string
  description?: string
  requiresApproval?: boolean
  defaultRetentionYears?: number
  defaultValidityMonths?: number
  defaultReviewMonths?: number
  isActive?: boolean
}

