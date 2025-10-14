export interface CreateComplianceDTO {
  requirementId: string
  organizationId: string
  assignedTo?: string
}

export interface UpdateComplianceDTO {
  status?: string
  assignedTo?: string
  comments?: string
  completedAt?: string
  nextReviewDate?: string
}

export interface ComplianceFilters {
  requirementId?: string
  organizationId?: string
  organizationIds?: string[] // For filtering by multiple organizations
  status?: string
  assignedTo?: string
  page?: number
  limit?: number
}
