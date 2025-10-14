import type { SupabaseClient } from "@supabase/supabase-js"
import type { DocumentType } from "@/types/domain/document-type"
import { logger } from "@/lib/logger"

export class DocumentTypeRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {
    logger.info("[DocumentTypeRepository] Initialized", { tenantId })
  }

  async findMany(filters?: any): Promise<DocumentType[]> {
    logger.debug("[DocumentTypeRepository] findMany", { filters })

    let query = this.supabase.from("document_types").select("*")

    // Global types (tenant_id IS NULL) OR tenant-specific
    query = query.or(`tenant_id.is.null,tenant_id.eq.${this.tenantId}`)

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive)
    }

    if (filters?.category) {
      query = query.eq("category", filters.category)
    }

    if (filters?.regulator) {
      query = query.eq("regulator", filters.regulator)
    }

    const { data, error } = await query.order("sort_order")

    if (error) {
      logger.error("[DocumentTypeRepository] findMany error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(this.fromDb)
  }

  async findById(id: string): Promise<DocumentType | null> {
    logger.debug("[DocumentTypeRepository] findById", { id })

    const { data, error } = await this.supabase
      .from("document_types")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null
      }
      logger.error("[DocumentTypeRepository] findById error", { error })
      throw new Error(error.message)
    }

    return this.fromDb(data)
  }

  async create(typeData: any): Promise<DocumentType> {
    const dbData = this.toDb(typeData)

    const { data, error } = await this.supabase
      .from("document_types")
      .insert({ ...dbData, tenant_id: this.tenantId })
      .select()
      .single()

    if (error) {
      logger.error("[DocumentTypeRepository] create error", { error })
      throw new Error(error.message)
    }

    return this.fromDb(data)
  }

  async update(id: string, typeData: any): Promise<DocumentType> {
    const dbData = this.toDb(typeData)

    const { data, error } = await this.supabase
      .from("document_types")
      .update(dbData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      logger.error("[DocumentTypeRepository] update error", { error })
      throw new Error(error.message)
    }

    return this.fromDb(data)
  }

  private fromDb(row: any): DocumentType {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      regulator: row.regulator,
      requirementCategory: row.requirement_category,
      requiresApproval: row.requires_approval,
      requiresRegistration: row.requires_registration,
      requiresNumber: row.requires_number,
      requiresDate: row.requires_date,
      requiresSignature: row.requires_signature,
      requiresStamp: row.requires_stamp,
      defaultRetentionYears: row.default_retention_years,
      retentionNote: row.retention_note,
      defaultValidityMonths: row.default_validity_months,
      defaultReviewMonths: row.default_review_months,
      icon: row.icon,
      color: row.color,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      defaultEvidenceTypeId: row.default_evidence_type_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  private toDb(type: Partial<DocumentType>): any {
    const dbData: any = {}

    if (type.code !== undefined) dbData.code = type.code
    if (type.name !== undefined) dbData.name = type.name
    if (type.description !== undefined) dbData.description = type.description
    if (type.category !== undefined) dbData.category = type.category
    if (type.regulator !== undefined) dbData.regulator = type.regulator
    if (type.requirementCategory !== undefined) dbData.requirement_category = type.requirementCategory
    if (type.requiresApproval !== undefined) dbData.requires_approval = type.requiresApproval
    if (type.requiresNumber !== undefined) dbData.requires_number = type.requiresNumber
    if (type.defaultRetentionYears !== undefined) dbData.default_retention_years = type.defaultRetentionYears
    if (type.defaultValidityMonths !== undefined) dbData.default_validity_months = type.defaultValidityMonths
    if (type.defaultReviewMonths !== undefined) dbData.default_review_months = type.defaultReviewMonths
    if (type.icon !== undefined) dbData.icon = type.icon
    if (type.color !== undefined) dbData.color = type.color
    if (type.isActive !== undefined) dbData.is_active = type.isActive

    return dbData
  }
}

