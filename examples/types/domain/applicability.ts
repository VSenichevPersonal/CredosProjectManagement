export interface ApplicabilityFilterRules {
  kiiCategory?: (1 | 2 | 3)[]
  pdnLevel?: (1 | 2 | 3 | 4)[]
  isFinancial?: boolean
  isHealthcare?: boolean
  isGovernment?: boolean
  hasForeignData?: boolean
  minEmployeeCount?: number
  maxEmployeeCount?: number
}

export type ApplicabilityRuleType = "automatic" | "manual"
export type MappingType = "automatic" | "manual_include" | "manual_exclude"

export interface RequirementApplicabilityRule {
  id: string
  tenantId: string
  requirementId: string
  ruleType: ApplicabilityRuleType
  filterRules: ApplicabilityFilterRules | null
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
}

export interface RequirementOrganizationMapping {
  id: string
  tenantId: string
  requirementId: string
  organizationId: string
  mappingType: MappingType
  reason: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
}

export interface ApplicabilityResult {
  requirementId: string
  totalOrganizations: number
  applicableOrganizations: number
  automaticCount: number
  manualIncludeCount: number
  manualExcludeCount: number
  organizations: Array<{
    id: string
    name: string
    mappingType: MappingType
    reason?: string
  }>
}
