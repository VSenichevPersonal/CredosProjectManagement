import type { ControlMeasureTemplate } from "@/types/domain/control-measure"

export class ControlMeasureTemplateMapper {
  static fromDb(row: any): ControlMeasureTemplate {
    return {
      id: row.id,
      code: row.code,
      name: row.title, // Map title to name for consistency
      title: row.title,
      description: row.description,
      measureType: row.measure_type || "preventive",
      implementationGuide: row.implementation_guide,
      estimatedEffort: row.estimated_effort,
      sortOrder: row.sort_order || 0,
      isActive: row.is_active ?? true,
      recommendedEvidenceTypeIds: row.recommended_evidence_type_ids || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    }
  }

  static toDb(data: Partial<ControlMeasureTemplate>): any {
    const dbData: any = {}

    if (data.code !== undefined) dbData.code = data.code
    if (data.title !== undefined) dbData.title = data.title
    if (data.name !== undefined && !data.title) dbData.title = data.name // Use name if title not provided
    if (data.description !== undefined) dbData.description = data.description
    if (data.measureType !== undefined) dbData.measure_type = data.measureType
    if (data.implementationGuide !== undefined) dbData.implementation_guide = data.implementationGuide
    if (data.estimatedEffort !== undefined) dbData.estimated_effort = data.estimatedEffort
    if (data.sortOrder !== undefined) dbData.sort_order = data.sortOrder
    if (data.isActive !== undefined) dbData.is_active = data.isActive
    if (data.createdBy !== undefined) dbData.created_by = data.createdBy
    if (data.recommendedEvidenceTypeIds !== undefined) {
      dbData.recommended_evidence_type_ids = data.recommendedEvidenceTypeIds
    }

    return dbData
  }
}
