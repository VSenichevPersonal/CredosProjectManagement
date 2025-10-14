import type { SupabaseClient } from "@supabase/supabase-js"
import type { RequirementLegalReference } from "@/types/domain/legal-reference"
import { LegalReferenceMapper } from "../mappers/legal-reference-mapper"
import { logger } from "@/lib/logger"
import { withTenantFilter } from "@/lib/supabase/tenant-filter"

export class LegalReferenceRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {
    logger.trace("[LegalReferenceRepository] Constructor called", { tenantId })
  }

  async findByRequirement(requirementId: string): Promise<RequirementLegalReference[]> {
    logger.trace("[LegalReferenceRepository] Finding by requirement", { requirementId, tenantId: this.tenantId })

    let query = this.supabase
      .from("requirement_legal_references")
      .select(
        `
        *,
        legal_articles (
          id,
          full_reference,
          title,
          content,
          article_number,
          part,
          paragraph,
          clause,
          subclause,
          regulatory_framework_id
        )
      `,
      )
      .eq("requirement_id", requirementId)

    query = withTenantFilter(query, this.tenantId)

    logger.trace("[LegalReferenceRepository] Executing query", { requirementId })

    const { data, error } = await query
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true })

    if (error) {
      logger.error("[LegalReferenceRepository] Failed to find by requirement", error as Error, {
        requirementId,
        errorCode: error.code,
        errorDetails: error.details,
      })
      throw new Error(error.message)
    }

    logger.debug("[LegalReferenceRepository] Found legal references", {
      requirementId,
      count: data?.length,
    })
    return (data || []).map(LegalReferenceMapper.fromDb)
  }

  async create(data: {
    requirementId: string
    legalArticleId: string
    isPrimary?: boolean
    relevanceNote?: string
    referenceType?: string
    notes?: string
    tenantId?: string
  }): Promise<RequirementLegalReference> {
    logger.trace("[LegalReferenceRepository] Create method called", {
      data,
      repositoryTenantId: this.tenantId,
    })

    const insertData = {
      requirement_id: data.requirementId || (data as any).requirement_id,
      legal_article_id: data.legalArticleId || (data as any).legal_article_id,
      is_primary: data.isPrimary !== undefined ? data.isPrimary : false,
      relevance_note: data.relevanceNote || (data as any).relevance_note || data.notes || null,
      tenant_id: data.tenantId || (data as any).tenant_id || this.tenantId,
    }

    logger.debug("[LegalReferenceRepository] Insert data prepared", {
      insertData,
      originalData: data,
      repositoryTenantId: this.tenantId,
    })

    if (!insertData.requirement_id) {
      const error = new Error("requirement_id is required")
      logger.error("[LegalReferenceRepository] Validation failed - missing requirement_id", error, { insertData })
      throw error
    }
    if (!insertData.legal_article_id) {
      const error = new Error("legal_article_id is required")
      logger.error("[LegalReferenceRepository] Validation failed - missing legal_article_id", error, { insertData })
      throw error
    }
    if (!insertData.tenant_id) {
      const error = new Error("tenant_id is required")
      logger.error("[LegalReferenceRepository] Validation failed - missing tenant_id", error, { insertData })
      throw error
    }

    logger.trace("[LegalReferenceRepository] Validation passed, executing insert", { insertData })

    const { data: created, error } = await this.supabase
      .from("requirement_legal_references")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error("[LegalReferenceRepository] Supabase insert failed", error as Error, {
        insertData,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
      })
      throw new Error(`Failed to create legal reference: ${error.message} (code: ${error.code})`)
    }

    logger.info("[LegalReferenceRepository] Legal reference created successfully", {
      id: created.id,
      requirement_id: created.requirement_id,
      legal_article_id: created.legal_article_id,
      tenant_id: created.tenant_id,
    })

    return LegalReferenceMapper.fromDb(created)
  }

  async update(
    id: string,
    data: {
      isPrimary?: boolean
      relevanceNote?: string
    },
  ): Promise<RequirementLegalReference> {
    logger.trace("[LegalReferenceRepository] Updating legal reference", { id, data })

    const updateData: any = {}
    if (data.isPrimary !== undefined) updateData.is_primary = data.isPrimary
    if (data.relevanceNote !== undefined) updateData.relevance_note = data.relevanceNote

    const { data: updated, error } = await this.supabase
      .from("requirement_legal_references")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        legal_articles (
          id,
          full_reference,
          title,
          content,
          article_number,
          part,
          paragraph,
          clause,
          subclause,
          regulatory_framework_id
        )
      `,
      )
      .single()

    if (error) {
      logger.error("[LegalReferenceRepository] Failed to update", error)
      throw new Error(error.message)
    }

    logger.debug("[LegalReferenceRepository] Updated legal reference", { id })
    return LegalReferenceMapper.fromDb(updated)
  }

  async delete(id: string): Promise<void> {
    logger.trace("[LegalReferenceRepository] Deleting legal reference", { id })

    const { error } = await this.supabase.from("requirement_legal_references").delete().eq("id", id)

    if (error) {
      logger.error("[LegalReferenceRepository] Failed to delete", error)
      throw new Error(error.message)
    }

    logger.debug("[LegalReferenceRepository] Deleted legal reference", { id })
  }
}
