export type RequirementStatus = "draft" | "active" | "archived"

export type Criticality = "critical" | "high" | "medium" | "low"

export type DocumentStatus = "need_document" | "ok" | "needs_update" | "not_relevant"

export type ExecutionMode = "strict" | "flexible"

export interface Regulator {
  id: string
  name: string
  shortName?: string
  code?: string
  description?: string
}

export interface RequirementCategory {
  id: string
  name: string
  code?: string
  description?: string
}

export interface Periodicity {
  id: string
  name: string
  code?: string
  description?: string
}

export interface VerificationMethod {
  id: string
  name: string
  code?: string
  description?: string
}

export interface ResponsibleRole {
  id: string
  name: string
  code?: string
  description?: string
}

export interface LegalArticle {
  id: string
  fullReference: string
  title?: string
  content?: string
  articleNumber?: string
  part?: string
  paragraph?: string
  clause?: string
}

export interface Requirement {
  id: string
  code: string
  title: string
  description: string
  status: RequirementStatus
  category?: string
  criticality?: Criticality

  documentId?: string // Direct reference to document
  parentId?: string // Direct reference to parent requirement

  effectiveDate: Date | null
  expirationDate: Date | null

  regulatorId?: string
  regulatoryFrameworkId?: string // Direct reference to regulatory framework
  // legalArticleId is managed through requirement_legal_references table (many-to-many)

  periodicityId?: string
  verificationMethodId?: string
  responsibleRoleId?: string
  documentStatus?: DocumentStatus

  measureMode: ExecutionMode
  evidenceTypeMode: ExecutionMode
  suggestedControlMeasureTemplateIds: string[]

  createdBy: string
  createdAt: Date
  updatedAt: Date

  // Relations
  regulator?: Regulator
  regulatoryFramework?: {
    id: string
    code: string
    name: string
    shortName?: string
    description?: string
    effectiveDate?: string
    category?: string
    authority?: string
    badgeText?: string
    badgeColor?: "blue" | "purple" | "orange" | "red" | "green" | "secondary" | "outline" | "default"
  }
  legalArticle?: LegalArticle // Loaded from requirement_legal_references
  periodicity?: Periodicity
  verificationMethod?: VerificationMethod
  responsibleRole?: ResponsibleRole
}
