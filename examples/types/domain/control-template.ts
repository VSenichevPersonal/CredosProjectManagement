/**
 * @intent: Domain types for Control Templates (типовые меры защиты)
 * @llm-note: Control templates are reusable security control blueprints
 * @architecture: DDD - Aggregate root with value objects
 */

// =====================================================
// ENUMS
// =====================================================

export type ControlType = "preventive" | "detective" | "corrective" | "compensating"
export type Frequency = "continuous" | "daily" | "weekly" | "monthly" | "quarterly" | "annually" | "on_demand"

// =====================================================
// ENTITIES
// =====================================================

/**
 * @intent: Control Template entity (типовая мера)
 * @llm-note: Template for creating controls, created by integrators
 */
export interface ControlTemplate {
  id: string
  code: string
  title: string
  description: string | null

  // Classification
  controlType: ControlType
  category: string | null

  // Execution parameters
  frequency: Frequency
  isAutomated: boolean

  // Time parameters
  estimatedImplementationDays: number | null  // Примерный срок внедрения (30, 60, 90 дней)
  validityPeriodMonths: number | null         // Срок действия меры (12, 24, 36 месяцев)

  // Guides
  implementationGuide: string | null
  testingProcedure: string | null

  // Metadata
  tags: string[]
  isPublic: boolean

  // Audit
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * @intent: Link between requirement and control template (рекомендация)
 * @llm-note: Represents recommended controls for a requirement
 */
export interface RequirementControlTemplate {
  id: string
  requirementId: string
  controlTemplateId: string

  // Recommendation priority
  isRecommended: boolean
  priority: number // 0-100, higher = more important

  // Context
  rationale: string | null

  // Audit
  createdBy: string | null
  createdAt: Date
}

// =====================================================
// VALUE OBJECTS
// =====================================================

/**
 * @intent: Template metadata for filtering and search
 */
export interface TemplateMetadata {
  category: string | null
  tags: string[]
  isPublic: boolean
}

/**
 * @intent: Recommendation details
 */
export interface TemplateRecommendation {
  template: ControlTemplate
  priority: number
  rationale: string | null
  isAlreadyApplied: boolean
}

// =====================================================
// DTOs
// =====================================================

/**
 * @intent: DTO for creating control template
 */
export interface CreateControlTemplateDTO {
  code: string
  title: string
  description?: string
  controlType: ControlType
  category?: string
  frequency: Frequency
  isAutomated?: boolean
  estimatedImplementationDays?: number
  validityPeriodMonths?: number
  implementationGuide?: string
  testingProcedure?: string
  tags?: string[]
  isPublic?: boolean
  createdBy?: string
}

/**
 * @intent: DTO for updating control template
 */
export interface UpdateControlTemplateDTO {
  title?: string
  description?: string
  controlType?: ControlType
  category?: string
  frequency?: Frequency
  isAutomated?: boolean
  estimatedImplementationDays?: number
  validityPeriodMonths?: number
  implementationGuide?: string
  testingProcedure?: string
  tags?: string[]
  isPublic?: boolean
}

/**
 * @intent: DTO for applying template to create control
 */
export interface ApplyTemplateDTO {
  templateId: string

  // Customization
  code?: string // Override template code
  title?: string // Override template title
  description?: string // Override template description
  owner?: string
  ownerId?: string

  // Context
  tenantId: string
  requirementIds?: string[] // Link to requirements
  createdBy?: string
}

/**
 * @intent: DTO for linking template to requirement
 */
export interface LinkTemplateToRequirementDTO {
  requirementId: string
  controlTemplateId: string
  priority?: number
  rationale?: string
  createdBy?: string
}

/**
 * @intent: Filters for querying templates
 */
export interface ControlTemplateFilters {
  controlType?: ControlType
  category?: string
  isPublic?: boolean
  tags?: string[]
  search?: string // Search in title/description
}
