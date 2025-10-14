export type ComplianceStatus =
  | "pending"
  | "compliant"
  | "non_compliant"
  | "partial"
  | "not_applicable"
  | "in_progress"
  | "not_started"
  | "pending_review"
  | "approved"
  | "rejected"

export interface Compliance {
  id: string
  requirementId: string
  organizationId: string
  status: ComplianceStatus
  assignedTo: string | null
  completedAt: Date | null
  reviewedBy: string | null
  reviewedAt: Date | null
  rejectionReason: string | null
  comments: string | null
  notes: string | null
  nextReviewDate: Date | null
  createdAt: Date
  updatedAt: Date
  tenantId?: string
}
