import type { Requirement } from "@/types/domain/requirement"
import { logger } from "@/lib/logger"

export class RequirementMapper {
  static fromDb(row: any): Requirement {
    logger.trace("[RequirementMapper] Mapping from DB", { id: row.id })

    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      category: row.category,
      criticality: row.criticality,
      status: row.status,
      documentId: row.document_id,
      parentId: row.parent_id,
      effectiveDate: row.effective_date ? new Date(row.effective_date) : undefined,
      expirationDate: row.expiration_date ? new Date(row.expiration_date) : undefined,
      regulatorId: row.regulator_id,
      regulatoryFrameworkId: row.regulatory_framework_id,
      legalArticleId: row.legal_article_id,
      periodicityId: row.periodicity_id,
      verificationMethodId: row.verification_method_id,
      responsibleRoleId: row.responsible_role_id,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      tenantId: row.tenant_id,
      regulatoryFramework: row.regulatory_framework
        ? {
            id: row.regulatory_framework.id,
            code: row.regulatory_framework.code,
            name: row.regulatory_framework.name,
            badgeText: row.regulatory_framework.badge_text,
            badgeColor: row.regulatory_framework.badge_color,
          }
        : undefined,
      measureMode: row.measure_mode,
      evidenceTypeMode: row.evidence_type_mode,
      suggestedControlMeasureTemplateIds: row.suggested_control_measure_template_ids,
    }
  }

  static toDb(data: any, tenantId: string): any {
    logger.trace("[RequirementMapper] Mapping to DB", { tenantId })

    const dbData: any = {
      tenant_id: data.tenantId || tenantId,
    }

    // Map all camelCase fields to snake_case
    if (data.code !== undefined) dbData.code = data.code
    if (data.title !== undefined) dbData.title = data.title
    if (data.description !== undefined) dbData.description = data.description
    if (data.status !== undefined) dbData.status = data.status
    if (data.criticality !== undefined) dbData.criticality = data.criticality
    if (data.categoryId !== undefined) dbData.category_id = data.categoryId
    if (data.regulatorId !== undefined) dbData.regulator_id = data.regulatorId
    if (data.regulatoryFrameworkId !== undefined) dbData.regulatory_framework_id = data.regulatoryFrameworkId
    if (data.periodicityId !== undefined) dbData.periodicity_id = data.periodicityId
    if (data.verificationMethodId !== undefined) dbData.verification_method_id = data.verificationMethodId
    if (data.responsibleRoleId !== undefined) dbData.responsible_role_id = data.responsibleRoleId
    if (data.documentId !== undefined) dbData.document_id = data.documentId
    if (data.parentId !== undefined) dbData.parent_id = data.parentId
    if (data.effectiveDate !== undefined) dbData.effective_date = data.effectiveDate
    if (data.expirationDate !== undefined) dbData.expiration_date = data.expirationDate
    if (data.createdBy !== undefined) dbData.created_by = data.createdBy
    if (data.measureMode !== undefined) dbData.measure_mode = data.measureMode
    if (data.evidenceTypeMode !== undefined) dbData.evidence_type_mode = data.evidenceTypeMode
    if (data.suggestedControlMeasureTemplateIds !== undefined) {
      dbData.suggested_control_measure_template_ids = data.suggestedControlMeasureTemplateIds
    }

    // Handle snake_case fields that might come from frontend
    if (data.category_id !== undefined) dbData.category_id = data.category_id
    if (data.regulator_id !== undefined) dbData.regulator_id = data.regulator_id
    if (data.regulatory_framework_id !== undefined) dbData.regulatory_framework_id = data.regulatory_framework_id
    if (data.periodicity_id !== undefined) dbData.periodicity_id = data.periodicity_id
    if (data.verification_method_id !== undefined) dbData.verification_method_id = data.verification_method_id
    if (data.responsible_role_id !== undefined) dbData.responsible_role_id = data.responsible_role_id
    if (data.document_id !== undefined) dbData.document_id = data.document_id
    if (data.parent_id !== undefined) dbData.parent_id = data.parent_id
    if (data.effective_date !== undefined) dbData.effective_date = data.effective_date
    if (data.expiration_date !== undefined) dbData.expiration_date = data.expiration_date
    if (data.measure_mode !== undefined) dbData.measure_mode = data.measure_mode
    if (data.evidence_type_mode !== undefined) dbData.evidence_type_mode = data.evidence_type_mode
    if (data.suggested_control_measure_template_ids !== undefined) {
      dbData.suggested_control_measure_template_ids = data.suggested_control_measure_template_ids
    }

    return dbData
  }
}
