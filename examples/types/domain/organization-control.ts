export type ImplementationStatus = "not_implemented" | "in_progress" | "implemented" | "verified" | "non_applicable"

export interface OrganizationControl {
  id: string
  tenantId: string
  organizationId: string
  controlId: string

  // Статус реализации
  implementationStatus: ImplementationStatus

  // Даты
  implementationDate?: Date
  verificationDate?: Date
  nextReviewDate?: Date

  // Ответственные
  responsibleUserId?: string
  verifierUserId?: string

  // Заметки
  implementationNotes?: string
  verificationNotes?: string

  // Метаданные
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface OrganizationControlWithDetails extends OrganizationControl {
  control?: {
    id: string
    code: string
    title: string
    description?: string
    category: string
    controlType: string
    frequency: string
    isAutomated: boolean
  }
  responsibleUser?: {
    id: string
    name: string
    email: string
  }
  verifierUser?: {
    id: string
    name: string
    email: string
  }
}
