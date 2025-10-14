import type { EvidenceType } from "@/types/domain/control-measure"

export class EvidenceTypeMapper {
  static fromDb(row: any): EvidenceType {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      fileFormatRegex: row.file_format_regex,
      icon: row.icon,
      sortOrder: row.sort_order || 0,
      isActive: row.is_active ?? true,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  static toDb(data: Partial<EvidenceType>): any {
    const dbData: any = {}

    if (data.code !== undefined) dbData.code = data.code
    if (data.title !== undefined) dbData.title = data.title
    if (data.description !== undefined) dbData.description = data.description
    if (data.fileFormatRegex !== undefined) dbData.file_format_regex = data.fileFormatRegex
    if (data.icon !== undefined) dbData.icon = data.icon
    if (data.sortOrder !== undefined) dbData.sort_order = data.sortOrder
    if (data.isActive !== undefined) dbData.is_active = data.isActive

    return dbData
  }
}
