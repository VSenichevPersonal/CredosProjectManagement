import type { RegulatoryFramework } from "@/types/domain/regulatory-framework"
import { logger } from "@/lib/logger"

export class RegulatoryFrameworkMapper {
  static fromDb(row: any): RegulatoryFramework {
    logger.trace("[RegulatoryFrameworkMapper] Mapping from DB", { id: row.id })

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      shortName: row.short_name,
      description: row.description,
      effectiveDate: row.effective_date,
      category: row.category,
      authority: row.authority,
      url: row.url,
      badgeText: row.badge_text,
      badgeColor: row.badge_color,
      documentTypeId: row.document_type_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  static toDb(data: any): any {
    logger.trace("[RegulatoryFrameworkMapper] Mapping to DB")

    const dbData: any = {}

    if (data.code !== undefined) dbData.code = data.code
    if (data.name !== undefined) dbData.name = data.name
    if (data.shortName !== undefined) dbData.short_name = data.shortName
    if (data.description !== undefined) dbData.description = data.description
    if (data.effectiveDate !== undefined) dbData.effective_date = data.effectiveDate
    if (data.category !== undefined) dbData.category = data.category
    if (data.authority !== undefined) dbData.authority = data.authority
    if (data.url !== undefined) dbData.url = data.url
    if (data.badgeText !== undefined) dbData.badge_text = data.badgeText
    if (data.badgeColor !== undefined) dbData.badge_color = data.badgeColor
    if (data.documentTypeId !== undefined) dbData.document_type_id = data.documentTypeId
    if (data.isActive !== undefined) dbData.is_active = data.isActive

    // Handle snake_case fields that might come from frontend
    if (data.short_name !== undefined) dbData.short_name = data.short_name
    if (data.effective_date !== undefined) dbData.effective_date = data.effective_date
    if (data.badge_text !== undefined) dbData.badge_text = data.badge_text
    if (data.badge_color !== undefined) dbData.badge_color = data.badge_color
    if (data.document_type_id !== undefined) dbData.document_type_id = data.document_type_id
    if (data.is_active !== undefined) dbData.is_active = data.is_active

    return dbData
  }
}
