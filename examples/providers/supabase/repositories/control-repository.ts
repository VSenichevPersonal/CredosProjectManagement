import type { SupabaseClient } from "@supabase/supabase-js"
import type { Control } from "@/types/domain/control"
import { ControlMapper } from "../mappers/control-mapper"
import { logger } from "@/lib/logger"

export class ControlRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {
    logger.info("[ControlRepository] Initialized", { tenantId })
  }

  async findMany(filters?: any): Promise<Control[]> {
    logger.debug("[ControlRepository] findMany", { filters })

    let query = this.supabase.from("controls").select("*").eq("tenant_id", this.tenantId)

    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.search) {
      query = query.or(`code.ilike.%${filters.search}%,title.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order(filters?.sortField || "code", {
      ascending: filters?.sortDirection !== "desc",
    })

    if (error) {
      logger.error("[ControlRepository] findMany error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(ControlMapper.fromDb)
  }

  async findById(id: string): Promise<Control | null> {
    logger.debug("[ControlRepository] findById", { id })

    const { data, error } = await this.supabase
      .from("controls")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      logger.error("[ControlRepository] findById error", { error })
      throw new Error(error.message)
    }

    return ControlMapper.fromDb(data)
  }

  async create(data: any): Promise<Control> {
    logger.debug("[ControlRepository] create", { data })

    const { data: created, error } = await this.supabase
      .from("controls")
      .insert({ ...data, tenant_id: data.tenantId || this.tenantId })
      .select()
      .single()

    if (error) {
      logger.error("[ControlRepository] create error", { error })
      throw new Error(error.message)
    }

    return ControlMapper.fromDb(created)
  }

  async update(id: string, data: any): Promise<Control> {
    logger.debug("[ControlRepository] update", { id, data })

    const { data: updated, error } = await this.supabase
      .from("controls")
      .update(data)
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .select()
      .single()

    if (error) {
      logger.error("[ControlRepository] update error", { error })
      throw new Error(error.message)
    }

    return ControlMapper.fromDb(updated)
  }

  async delete(id: string): Promise<void> {
    logger.debug("[ControlRepository] delete", { id })

    const { error } = await this.supabase.from("controls").delete().eq("id", id).eq("tenant_id", this.tenantId)

    if (error) {
      logger.error("[ControlRepository] delete error", { error })
      throw new Error(error.message)
    }
  }
}
