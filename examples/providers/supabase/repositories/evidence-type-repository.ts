import type { SupabaseClient } from "@supabase/supabase-js"
import type { EvidenceType } from "@/types/domain/control-measure"
import { EvidenceTypeMapper } from "../mappers/evidence-type-mapper"
import { logger } from "@/lib/logger"

export class EvidenceTypeRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId?: string,
  ) {
    if (!supabase) {
      throw new Error("[EvidenceTypeRepository] Supabase client is required")
    }
    logger.info("[EvidenceTypeRepository] Initialized", { tenantId })
  }

  async findMany(filters?: { isActive?: boolean }): Promise<EvidenceType[]> {
    logger.debug("[EvidenceTypeRepository] findMany", { filters })

    let query = this.supabase.from("evidence_types").select("*")

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive)
    }

    const { data, error } = await query.order("sort_order", { ascending: true })

    if (error) {
      logger.error("[EvidenceTypeRepository] findMany error", { error })
      throw new Error(error.message)
    }

    logger.info("[EvidenceTypeRepository] findMany success", { count: data?.length })
    return (data || []).map(EvidenceTypeMapper.fromDb)
  }

  async findById(id: string): Promise<EvidenceType | null> {
    logger.debug("[EvidenceTypeRepository] findById", { id })

    const { data, error } = await this.supabase.from("evidence_types").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        logger.debug("[EvidenceTypeRepository] findById not found", { id })
        return null
      }
      logger.error("[EvidenceTypeRepository] findById error", { error })
      throw new Error(error.message)
    }

    logger.info("[EvidenceTypeRepository] findById success", { id })
    return EvidenceTypeMapper.fromDb(data)
  }

  async create(data: any): Promise<EvidenceType> {
    logger.debug("[EvidenceTypeRepository] create", { data })

    const insertData = EvidenceTypeMapper.toDb(data)

    const { data: created, error } = await this.supabase.from("evidence_types").insert(insertData).select().single()

    if (error) {
      logger.error("[EvidenceTypeRepository] create error", { error })
      throw new Error(error.message)
    }

    logger.info("[EvidenceTypeRepository] create success", { id: created.id })
    return EvidenceTypeMapper.fromDb(created)
  }

  async update(id: string, data: any): Promise<EvidenceType> {
    logger.debug("[EvidenceTypeRepository] update", { id, data })

    const updateData = EvidenceTypeMapper.toDb(data)

    const { data: updated, error } = await this.supabase
      .from("evidence_types")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      logger.error("[EvidenceTypeRepository] update error", { error })
      throw new Error(error.message)
    }

    logger.info("[EvidenceTypeRepository] update success", { id })
    return EvidenceTypeMapper.fromDb(updated)
  }

  async delete(id: string): Promise<void> {
    logger.debug("[EvidenceTypeRepository] delete", { id })

    const { error } = await this.supabase.from("evidence_types").delete().eq("id", id)

    if (error) {
      logger.error("[EvidenceTypeRepository] delete error", { error })
      throw new Error(error.message)
    }

    logger.info("[EvidenceTypeRepository] delete success", { id })
  }
}
