import type { SupabaseClient } from "@supabase/supabase-js"
import type { ControlMeasureTemplate } from "@/types/domain/control-measure"
import { ControlMeasureTemplateMapper } from "../mappers/control-measure-template-mapper"
import { logger } from "@/lib/logger"

export class ControlMeasureTemplateRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {
    if (!supabase) {
      throw new Error("[ControlMeasureTemplateRepository] Supabase client is required")
    }
    logger.info("[ControlMeasureTemplateRepository] Initialized", { tenantId })
  }

  async findMany(filters?: { isActive?: boolean; filters?: { id?: { in?: string[] } } }): Promise<
    ControlMeasureTemplate[]
  > {
    logger.debug("[ControlMeasureTemplateRepository] findMany", { filters })

    let query = this.supabase.from("control_measure_templates").select("*")

    query = query.eq("tenant_id", this.tenantId)

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive)
    }

    if (filters?.filters?.id?.in && filters.filters.id.in.length > 0) {
      query = query.in("id", filters.filters.id.in)
    }

    const { data, error } = await query.order("sort_order", { ascending: true })

    if (error) {
      logger.error("[ControlMeasureTemplateRepository] findMany error", { error })
      throw new Error(error.message)
    }

    logger.info("[ControlMeasureTemplateRepository] findMany success", { count: data?.length })
    return (data || []).map(ControlMeasureTemplateMapper.fromDb)
  }

  async findById(id: string): Promise<ControlMeasureTemplate | null> {
    logger.debug("[ControlMeasureTemplateRepository] findById", { id })

    console.log("[v0] [ControlMeasureTemplateRepository] findById with filters:", {
      id,
      tenantId: this.tenantId,
    })

    const { data, error } = await this.supabase
      .from("control_measure_templates")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .single()

    if (data) {
      console.log("[v0] [ControlMeasureTemplateRepository] findById result tenant_id:", {
        expectedTenantId: this.tenantId,
        actualTenantId: data.tenant_id,
        match: data.tenant_id === this.tenantId,
      })
    }

    if (error) {
      if (error.code === "PGRST116") {
        logger.debug("[ControlMeasureTemplateRepository] findById not found", { id })
        return null
      }
      logger.error("[ControlMeasureTemplateRepository] findById error", { error })
      throw new Error(error.message)
    }

    logger.info("[ControlMeasureTemplateRepository] findById success", { id })
    return ControlMeasureTemplateMapper.fromDb(data)
  }

  async findByRequirement(requirementId: string): Promise<ControlMeasureTemplate[]> {
    logger.debug("[ControlMeasureTemplateRepository] findByRequirement", { requirementId })

    const { data, error } = await this.supabase
      .from("control_measure_templates")
      .select("*")
      .eq("requirement_id", requirementId)
      .eq("is_active", true)
      .eq("tenant_id", this.tenantId)
      .order("sort_order", { ascending: true })

    if (error) {
      logger.error("[ControlMeasureTemplateRepository] findByRequirement error", { error })
      throw new Error(error.message)
    }

    logger.info("[ControlMeasureTemplateRepository] findByRequirement success", { count: data?.length })
    return (data || []).map(ControlMeasureTemplateMapper.fromDb)
  }

  async create(data: any): Promise<ControlMeasureTemplate> {
    logger.debug("[ControlMeasureTemplateRepository] create", { data })

    const insertData = ControlMeasureTemplateMapper.toDb(data)

    insertData.tenant_id = this.tenantId

    const { data: created, error } = await this.supabase
      .from("control_measure_templates")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error("[ControlMeasureTemplateRepository] create error", { error })
      throw new Error(error.message)
    }

    logger.info("[ControlMeasureTemplateRepository] create success", { id: created.id })
    return ControlMeasureTemplateMapper.fromDb(created)
  }

  async update(id: string, data: any): Promise<ControlMeasureTemplate> {
    logger.debug("[ControlMeasureTemplateRepository] update", { id, data })

    const updateData = ControlMeasureTemplateMapper.toDb(data)

    console.log(
      "[v0] [ControlMeasureTemplateRepository] updateData being sent to Supabase:",
      JSON.stringify(updateData, null, 2),
    )

    const { error: updateError } = await this.supabase
      .from("control_measure_templates")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", this.tenantId)

    if (updateError) {
      logger.error("[ControlMeasureTemplateRepository] update error", { error: updateError })
      throw new Error(updateError.message)
    }

    const { data: updated, error: selectError } = await this.supabase
      .from("control_measure_templates")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .maybeSingle()

    console.log("[v0] [ControlMeasureTemplateRepository] Supabase response:", { updated, error: selectError })

    if (selectError) {
      logger.error("[ControlMeasureTemplateRepository] select after update error", { error: selectError })
      throw new Error(selectError.message)
    }

    if (!updated) {
      logger.error("[ControlMeasureTemplateRepository] update not found", { id })
      throw new Error(`Control measure template with id ${id} not found`)
    }

    logger.info("[ControlMeasureTemplateRepository] update success", { id })
    return ControlMeasureTemplateMapper.fromDb(updated)
  }

  async delete(id: string): Promise<void> {
    logger.debug("[ControlMeasureTemplateRepository] delete", { id })

    const { error } = await this.supabase
      .from("control_measure_templates")
      .delete()
      .eq("id", id)
      .eq("tenant_id", this.tenantId)

    if (error) {
      logger.error("[ControlMeasureTemplateRepository] delete error", { error })
      throw new Error(error.message)
    }

    logger.info("[ControlMeasureTemplateRepository] delete success", { id })
  }
}
