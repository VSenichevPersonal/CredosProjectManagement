import type { SupabaseClient } from "@supabase/supabase-js"
import type { Compliance } from "@/types/domain/compliance"
import { ComplianceMapper } from "../mappers/compliance-mapper"
import { logger } from "@/lib/logger"

export class ComplianceRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {
    logger.info("[ComplianceRepository] Initialized", { tenantId })
  }

  async findMany(filters?: {
    status?: string
    organizationId?: string
    requirementId?: string
    organizationIds?: string[]
  }): Promise<Compliance[]> {
    let query = this.supabase
      .from("compliance_records")
      .select(
        `
        *,
        organization:organizations!compliance_records_organization_id_fkey(id, name),
        requirement:requirements!compliance_records_requirement_id_fkey(
          id, 
          code, 
          title, 
          measure_mode, 
          evidence_type_mode,
          suggested_control_measure_template_ids
        )
      `,
      )
      .eq("tenant_id", this.tenantId)

    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.organizationId) query = query.eq("organization_id", filters.organizationId)
    if (filters?.requirementId) query = query.eq("requirement_id", filters.requirementId)
    if (filters?.organizationIds && filters.organizationIds.length > 0) {
      query = query.in("organization_id", filters.organizationIds)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      logger.error("[ComplianceRepository] findMany error", error)
      throw new Error(error.message)
    }

    return (data || []).map(ComplianceMapper.fromDb)
  }

  async findById(id: string): Promise<Compliance | null> {
    const { data, error } = await this.supabase
      .from("compliance_records")
      .select(
        `
        *,
        organization:organizations!compliance_records_organization_id_fkey(id, name),
        requirement:requirements!compliance_records_requirement_id_fkey(
          id, 
          code, 
          title,
          description,
          measure_mode, 
          evidence_type_mode,
          suggested_control_measure_template_ids
        )
      `,
      )
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      logger.error("[ComplianceRepository] findById error", error)
      throw new Error(error.message)
    }

    return ComplianceMapper.fromDb(data)
  }

  async findByOrganization(orgId: string): Promise<Compliance[]> {
    const { data, error } = await this.supabase
      .from("compliance_records")
      .select(
        `
        *,
        organization:organizations!compliance_records_organization_id_fkey(id, name),
        requirement:requirements!compliance_records_requirement_id_fkey(
          id, 
          code, 
          title, 
          measure_mode, 
          evidence_type_mode,
          suggested_control_measure_template_ids
        )
      `,
      )
      .eq("organization_id", orgId)
      .eq("tenant_id", this.tenantId)

    if (error) {
      logger.error("[ComplianceRepository] findByOrganization error", error)
      throw new Error(error.message)
    }

    return (data || []).map(ComplianceMapper.fromDb)
  }

  async create(data: {
    requirementId: string
    organizationId: string
    status: string
    tenantId?: string
  }): Promise<Compliance> {
    const insertData = {
      requirement_id: data.requirementId,
      organization_id: data.organizationId,
      status: data.status,
      tenant_id: data.tenantId || this.tenantId,
    }

    const { data: created, error } = await this.supabase.from("compliance_records").insert(insertData).select().single()

    if (error) {
      logger.error("[ComplianceRepository] create error", error)
      throw new Error(error.message)
    }

    return ComplianceMapper.fromDb(created)
  }

  async update(id: string, data: Partial<Compliance>): Promise<Compliance> {
    const updateData = ComplianceMapper.toDb(data)

    const { data: updated, error } = await this.supabase
      .from("compliance_records")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .select()
      .single()

    if (error) {
      logger.error("[ComplianceRepository] update error", error)
      throw new Error(error.message)
    }

    return ComplianceMapper.fromDb(updated)
  }

  async createMany(
    records: Array<{
      requirementId: string
      organizationId: string
      status: string
      tenantId?: string
    }>,
  ): Promise<void> {
    const insertData = records.map((d) => ({
      requirement_id: d.requirementId,
      organization_id: d.organizationId,
      status: d.status,
      tenant_id: d.tenantId || this.tenantId,
    }))

    const { error } = await this.supabase.from("compliance_records").insert(insertData)

    if (error) {
      logger.error("[ComplianceRepository] createMany error", error)
      throw new Error(error.message)
    }
  }
}
