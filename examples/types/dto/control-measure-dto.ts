/**
 * DTO для работы с мерами контроля
 */

import type { ControlMeasure, ControlMeasureTemplate } from "../domain/control-measure"

export interface CreateControlMeasureDTO {
  requirementAssignmentId: string
  templateId?: string // Если используется шаблон
  title: string
  description?: string
  implementationDetails?: string
  responsibleUserId?: string
  dueDate?: string
  status: "planned" | "in_progress" | "implemented" | "verified"
}

export interface UpdateControlMeasureDTO {
  title?: string
  description?: string
  implementationDetails?: string
  responsibleUserId?: string
  dueDate?: string
  status?: "planned" | "in_progress" | "implemented" | "verified"
  completedAt?: string
}

export interface ControlMeasureWithTemplateDTO extends ControlMeasure {
  template?: ControlMeasureTemplate
}

export interface ValidateControlMeasureDTO {
  requirementAssignmentId: string
  measureMode: "strict" | "flexible"
  suggestedTemplateIds: string[]
  proposedMeasure: CreateControlMeasureDTO
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
