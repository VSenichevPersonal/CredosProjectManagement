export interface RegulatoryFramework {
  id: string
  code: string
  name: string
  shortName?: string
  description?: string
  effectiveDate?: string
  category?: "federal_law" | "government_decree" | "agency_order" | "standard"
  authority?: string
  url?: string
  badgeText?: string
  badgeColor?: "blue" | "purple" | "orange" | "red" | "green" | "secondary" | "outline" | "default"
  documentTypeId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRegulatoryFrameworkInput {
  code: string
  name: string
  shortName?: string
  description?: string
  effectiveDate?: string
  category?: "federal_law" | "government_decree" | "agency_order" | "standard"
  authority?: string
  url?: string
  badgeText?: string
  badgeColor?: "blue" | "purple" | "orange" | "red" | "green" | "secondary" | "outline" | "default"
  documentTypeId?: string
}

export interface UpdateRegulatoryFrameworkInput extends Partial<CreateRegulatoryFrameworkInput> {
  isActive?: boolean
}

export const REGULATORY_FRAMEWORK_CATEGORIES = {
  federal_law: "Федеральный закон",
  government_decree: "Постановление Правительства",
  agency_order: "Приказ ведомства",
  standard: "ГОСТ/Стандарт",
} as const
