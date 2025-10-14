import type { SupabaseClient } from "@supabase/supabase-js"
import type { RegulatoryFramework } from "@/types/domain/regulatory-framework"
import { RegulatoryFrameworkMapper } from "../mappers/regulatory-framework-mapper"
import { logger } from "@/lib/logger"

export class RegulatoryFrameworkRepository {
  constructor(private supabase: SupabaseClient) {
    if (!supabase) {
      throw new Error("[RegulatoryFrameworkRepository] Supabase client is required")
    }
    logger.info("[RegulatoryFrameworkRepository] Initialized")
  }

  async findMany(): Promise<RegulatoryFramework[]> {
    logger.debug("[RegulatoryFrameworkRepository] findMany")

    const { data, error } = await this.supabase
      .from("regulatory_frameworks")
      .select("*")
      .eq("is_active", true)
      .order("code", { ascending: true })

    if (error) {
      logger.error("[RegulatoryFrameworkRepository] findMany error", { error })
      throw new Error(error.message)
    }

    logger.info("[RegulatoryFrameworkRepository] findMany success", { count: data?.length })
    return (data || []).map(RegulatoryFrameworkMapper.fromDb)
  }

  async findById(id: string): Promise<RegulatoryFramework | null> {
    logger.debug("[RegulatoryFrameworkRepository] findById", { id })

    const { data, error } = await this.supabase.from("regulatory_frameworks").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        logger.debug("[RegulatoryFrameworkRepository] findById not found", { id })
        return null
      }
      logger.error("[RegulatoryFrameworkRepository] findById error", { error })
      throw new Error(error.message)
    }

    logger.info("[RegulatoryFrameworkRepository] findById success", { id })
    return RegulatoryFrameworkMapper.fromDb(data)
  }

  async create(data: any): Promise<RegulatoryFramework> {
    logger.debug("[RegulatoryFrameworkRepository] create", { data })

    const insertData = RegulatoryFrameworkMapper.toDb(data)

    const { data: created, error } = await this.supabase
      .from("regulatory_frameworks")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error("[RegulatoryFrameworkRepository] create error", { error })
      throw new Error(error.message)
    }

    logger.info("[RegulatoryFrameworkRepository] create success", { id: created.id })
    return RegulatoryFrameworkMapper.fromDb(created)
  }

  async update(id: string, data: any): Promise<RegulatoryFramework> {
    logger.debug("[RegulatoryFrameworkRepository] update", { id, data })

    const updateData = RegulatoryFrameworkMapper.toDb(data)

    const { data: updated, error } = await this.supabase
      .from("regulatory_frameworks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      logger.error("[RegulatoryFrameworkRepository] update error", { error })
      throw new Error(error.message)
    }

    logger.info("[RegulatoryFrameworkRepository] update success", { id })
    return RegulatoryFrameworkMapper.fromDb(updated)
  }

  async delete(id: string): Promise<void> {
    logger.debug("[RegulatoryFrameworkRepository] delete", { id })

    const { error } = await this.supabase.from("regulatory_frameworks").delete().eq("id", id)

    if (error) {
      logger.error("[RegulatoryFrameworkRepository] delete error", { error })
      throw new Error(error.message)
    }

    logger.info("[RegulatoryFrameworkRepository] delete success", { id })
  }
}
