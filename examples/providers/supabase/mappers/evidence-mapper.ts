import type { Evidence } from "@/types/domain/evidence"

export class EvidenceMapper {
  static fromDb(row: any): Evidence {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      organizationId: row.organization_id,
      complianceRecordId: row.compliance_record_id,
      requirementId: row.requirement_id,
      controlId: row.control_id,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileType: row.file_type,
      fileSize: row.file_size,
      storagePath: row.storage_path,
      evidenceTypeId: row.evidence_type_id,  // ✅ Добавлен маппинг
      evidenceType: row.evidence_type || "other",
      typeMetadata: row.type_metadata,
      title: row.title,
      description: row.description,
      tags: row.tags || [],
      status: row.status,
      uploadedBy: row.uploaded_by,
      uploadedAt: new Date(row.uploaded_at),
      reviewNotes: row.review_notes,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      createdAt: new Date(row.created_at || row.uploaded_at),
      updatedAt: new Date(row.updated_at || row.uploaded_at),
    }
  }

  static toDb(evidence: Partial<Evidence>): any {
    const dbData: any = {}

    if (evidence.tenantId !== undefined) dbData.tenant_id = evidence.tenantId
    if (evidence.organizationId !== undefined) dbData.organization_id = evidence.organizationId
    if (evidence.complianceRecordId !== undefined) dbData.compliance_record_id = evidence.complianceRecordId
    if (evidence.requirementId !== undefined) dbData.requirement_id = evidence.requirementId
    if (evidence.controlId !== undefined) dbData.control_id = evidence.controlId
    if (evidence.fileName !== undefined) dbData.file_name = evidence.fileName
    if (evidence.fileUrl !== undefined) dbData.file_url = evidence.fileUrl
    if (evidence.fileType !== undefined) dbData.file_type = evidence.fileType
    if (evidence.fileSize !== undefined) dbData.file_size = evidence.fileSize
    if (evidence.storagePath !== undefined) dbData.storage_path = evidence.storagePath
    if (evidence.evidenceTypeId !== undefined) dbData.evidence_type_id = evidence.evidenceTypeId  // ✅ Добавлен маппинг
    if (evidence.evidenceType !== undefined) dbData.evidence_type = evidence.evidenceType
    if (evidence.typeMetadata !== undefined) dbData.type_metadata = evidence.typeMetadata
    if (evidence.title !== undefined) dbData.title = evidence.title
    if (evidence.description !== undefined) dbData.description = evidence.description
    if (evidence.tags !== undefined) dbData.tags = evidence.tags
    if (evidence.status !== undefined) dbData.status = evidence.status
    if (evidence.uploadedBy !== undefined) dbData.uploaded_by = evidence.uploadedBy
    if (evidence.uploadedAt !== undefined) dbData.uploaded_at = evidence.uploadedAt
    if (evidence.reviewNotes !== undefined) dbData.review_notes = evidence.reviewNotes
    if (evidence.reviewedBy !== undefined) dbData.reviewed_by = evidence.reviewedBy
    if (evidence.reviewedAt !== undefined) dbData.reviewed_at = evidence.reviewedAt

    return dbData
  }
}
