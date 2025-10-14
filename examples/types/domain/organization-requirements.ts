export interface OrganizationRequirementsResult {
  organizationId: string
  totalRequirements: number
  applicableRequirements: number
  automaticCount: number
  manualIncludeCount: number
  manualExcludeCount: number
  requirements: Array<{
    id: string
    code: string
    name: string
    mappingType: "automatic" | "manual_include" | "manual_exclude"
    reason?: string
    regulatoryFramework?: string
    criticality?: string
  }>
}
