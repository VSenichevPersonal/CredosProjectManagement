import type { Compliance } from "@/types/domain/compliance"
import type { Organization } from "@/types/domain/organization"
import type { Requirement } from "@/types/domain/requirement"

export class ComplianceMapper {
  static fromDb(row: any): Compliance & { organization?: Organization; requirement?: Requirement } {
    const compliance: Compliance = {
      id: row.id,
      requirementId: row.requirement_id,
      organizationId: row.organization_id,
      status: row.status,
      assignedTo: row.assigned_to,
      comments: row.comments || row.notes,
      notes: row.notes,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
      rejectionReason: row.rejection_reason,
      nextReviewDate: row.next_review_date ? new Date(row.next_review_date) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      tenantId: row.tenant_id,
    }

    const result: any = compliance

    if (row.organization) {
      result.organization = {
        id: row.organization.id,
        name: row.organization.name,
      }
    }

    if (row.requirement) {
      result.requirement = {
        id: row.requirement.id,
        code: row.requirement.code,
        title: row.requirement.title,
      }
    }

    return result
  }

  static toDb(data: Partial<Compliance>): any {
    const result: any = {}

    if (data.requirementId !== undefined) result.requirement_id = data.requirementId
    if (data.organizationId !== undefined) result.organization_id = data.organizationId
    if (data.status !== undefined) result.status = data.status
    if (data.assignedTo !== undefined) result.assigned_to = data.assignedTo
    if (data.comments !== undefined) {
      result.comments = data.comments
      result.notes = data.comments
    }
    if (data.notes !== undefined) result.notes = data.notes
    if (data.completedAt !== undefined) result.completed_at = data.completedAt
    if (data.reviewedBy !== undefined) result.reviewed_by = data.reviewedBy
    if (data.reviewedAt !== undefined) result.reviewed_at = data.reviewedAt
    if (data.rejectionReason !== undefined) result.rejection_reason = data.rejectionReason
    if (data.nextReviewDate !== undefined) result.next_review_date = data.nextReviewDate
    if (data.tenantId !== undefined) result.tenant_id = data.tenantId

    return result
  }
}
