export interface CreateRequirementDTO {
  code: string
  title: string
  description: string
  status?: "draft" | "active" | "archived"
  category?: string
  criticality?: "critical" | "high" | "medium" | "low"
  documentId?: string
  parentId?: string
  effectiveDate?: string
  expirationDate?: string
  regulatorId?: string
  periodicityId?: string
  verificationMethodId?: string
  responsibleRoleId?: string
}

export interface UpdateRequirementDTO {
  code?: string
  title?: string
  description?: string
  status?: "draft" | "active" | "archived"
  category?: string
  criticality?: "critical" | "high" | "medium" | "low"
  documentId?: string
  parentId?: string
  effectiveDate?: string
  expirationDate?: string
  regulatorId?: string
  periodicityId?: string
  verificationMethodId?: string
  responsibleRoleId?: string
}

export interface RequirementFilters {
  category?: string
  criticality?: string
  status?: string
  search?: string
  page?: number
  limit?: number
  isActive?: boolean
}
