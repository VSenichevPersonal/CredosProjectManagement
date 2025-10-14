export type MappingType = "direct" | "indirect" | "partial"

export interface RequirementControl {
  id: string
  tenantId: string
  requirementId: string
  controlId: string

  // Тип маппинга
  mappingType: MappingType
  coveragePercentage?: number
  mappingNotes?: string

  isOptional: boolean // Контроль является опциональным для требования

  // Метаданные
  createdAt: Date
  createdBy?: string
}

export interface RequirementControlWithDetails extends RequirementControl {
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
}
