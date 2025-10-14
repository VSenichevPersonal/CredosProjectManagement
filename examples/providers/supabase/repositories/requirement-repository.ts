import type { SupabaseClient } from "@supabase/supabase-js"
import type { Requirement } from "@/types/domain/requirement"
import { RequirementMapper } from "../mappers/requirement-mapper"
import { logger } from "@/lib/logger"

export class RequirementRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {
    if (!supabase) {
      throw new Error("[RequirementRepository] Supabase client is required")
    }
    logger.info("[RequirementRepository] Initialized", { tenantId })
  }

  async findMany(filters?: any): Promise<Requirement[]> {
    logger.debug("[RequirementRepository] findMany", { filters })

    let query = this.supabase.from("requirements").select("*")
    query = query.eq("tenant_id", this.tenantId)

    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.criticality_level) query = query.eq("criticality", filters.criticality_level)
    if (filters?.criticality) query = query.eq("criticality", filters.criticality)
    if (filters?.regulatoryFrameworkId) query = query.eq("regulatory_framework_id", filters.regulatoryFrameworkId)
    if (filters?.regulatory_framework_id) query = query.eq("regulatory_framework_id", filters.regulatory_framework_id)
    if (filters?.search) {
      query = query.or(`code.ilike.%${filters.search}%,title.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order(filters?.sortField || "code", {
      ascending: filters?.sortDirection !== "desc",
    })

    if (error) {
      logger.error("[RequirementRepository] findMany error", { error })
      throw new Error(error.message)
    }

    logger.info("[RequirementRepository] findMany success", { count: data?.length })
    return (data || []).map(RequirementMapper.fromDb)
  }

  async findById(id: string): Promise<Requirement | null> {
    logger.debug("[RequirementRepository] findById", { id })

    const { data, error } = await this.supabase
      .from("requirements")
      .select(`
        *,
        regulatory_frameworks:regulatory_framework_id (
          id,
          name,
          code,
          description
        )
      `)
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        logger.debug("[RequirementRepository] findById not found", { id })
        return null
      }
      logger.error("[RequirementRepository] findById error", { error })
      throw new Error(error.message)
    }

    logger.info("[RequirementRepository] findById success", { id })
    const requirement = RequirementMapper.fromDb(data)
    
    // Add nested relationships
    if (data.regulatory_frameworks) {
      requirement.regulatoryFramework = data.regulatory_frameworks
    }
    if (data.regulatory_documents) {
      requirement.regulatoryDocument = data.regulatory_documents
    }
    
    return requirement
  }

  async create(data: any): Promise<Requirement> {
    logger.debug("[RequirementRepository] create", { data })

    const insertData = RequirementMapper.toDb(data, this.tenantId)

    const { data: created, error } = await this.supabase.from("requirements").insert(insertData).select().single()

    if (error) {
      logger.error("[RequirementRepository] create error", { error })
      throw new Error(error.message)
    }

    logger.info("[RequirementRepository] create success", { id: created.id })
    return RequirementMapper.fromDb(created)
  }

  async update(id: string, data: any): Promise<Requirement> {
    logger.debug("[RequirementRepository] update", { id, data })

    const updateData = RequirementMapper.toDb(data, this.tenantId)

    const { data: updated, error } = await this.supabase
      .from("requirements")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .select()
      .single()

    if (error) {
      logger.error("[RequirementRepository] update error", { error })
      throw new Error(error.message)
    }

    logger.info("[RequirementRepository] update success", { id })
    return RequirementMapper.fromDb(updated)
  }

  async delete(id: string): Promise<void> {
    logger.debug("[RequirementRepository] delete", { id })

    const { error } = await this.supabase.from("requirements").delete().eq("id", id).eq("tenant_id", this.tenantId)

    if (error) {
      logger.error("[RequirementRepository] delete error", { error })
      throw new Error(error.message)
    }

    logger.info("[RequirementRepository] delete success", { id })
  }
}
