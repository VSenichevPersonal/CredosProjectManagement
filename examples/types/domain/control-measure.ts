export type ExecutionMode = "strict" | "flexible"

export type ControlMeasureStatus = "planned" | "in_progress" | "implemented" | "verified" | "failed"

// Тип доказательства (справочник)
export interface EvidenceType {
  id: string
  code: string
  title: string
  description?: string
  fileFormatRegex?: string
  icon?: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Шаблон меры (рекомендация для требования)
export interface ControlMeasureTemplate {
  id: string
  code: string
  name: string // Added name field for consistency with form
  title?: string // Made title optional for backward compatibility
  description?: string
  category?: string // Added category field
  measureType: "preventive" | "detective" | "corrective" | "compensating" // Added measureType field
  implementationGuide?: string
  estimatedEffort?: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

// Конкретная мера для назначения требования
export interface ControlMeasure {
  id: string
  tenantId: string

  // Связи
  complianceRecordId: string
  requirementId: string
  organizationId: string
  templateId?: string

  // Основная информация
  title: string
  description?: string
  implementationNotes?: string

  // Статус и отслеживание
  status: ControlMeasureStatus
  responsibleUserId?: string

  // Временные параметры
  targetImplementationDate?: Date     // Плановая дата реализации
  actualImplementationDate?: Date     // Фактическая дата реализации (ранее implementationDate)
  nextReviewDate?: Date               // Следующая проверка
  validUntil?: Date                   // Срок действия меры
  
  // Расчетные поля
  daysUntilDue?: number               // Дней до срока (может быть отрицательным)
  isOverdue: boolean                  // Просрочена ли реализация

  // Флаги для strict режима
  fromTemplate: boolean
  isLocked: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string

  // Связанные данные (для UI)
  template?: ControlMeasureTemplate
  responsibleUser?: {
    id: string
    fullName: string
    email: string
  }
  evidenceLinks?: EvidenceLink[]
  linkedEvidence?: Array<{
    id: string
    fileName: string
    fileUrl: string
    evidenceType: string
    status: string
    linkNotes?: string
    relevanceScore?: number
  }>
  evidenceTypes?: EvidenceType[]
}

export interface EvidenceLink {
  id: string
  tenantId: string
  evidenceId: string
  controlMeasureId: string
  linkNotes?: string
  relevanceScore?: number
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string

  // Relations for UI
  evidence?: {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    evidenceTypeId?: string
  }
  controlMeasure?: {
    id: string
    title: string
    status: ControlMeasureStatus
  }
}
