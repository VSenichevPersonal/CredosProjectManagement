import type { SupabaseClient } from "@supabase/supabase-js"
import type { Evidence } from "@/types/domain/evidence"
import { EvidenceMapper } from "../mappers/evidence-mapper"
import { logger } from "@/lib/logger"

export class EvidenceRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {
    logger.info("[EvidenceRepository] Initialized", { tenantId })
  }

  private withTenantFilter(query: any) {
    return query.eq("tenant_id", this.tenantId)
  }

  async findMany(filters?: any): Promise<Evidence[]> {
    logger.debug("[EvidenceRepository] findMany", { filters })

    let query = this.supabase.from("evidence").select("*")
    query = this.withTenantFilter(query)

    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.organizationId) query = query.eq("organization_id", filters.organizationId)
    if (filters?.complianceRecordId) query = query.eq("compliance_record_id", filters.complianceRecordId)
    if (filters?.requirementId) query = query.eq("requirement_id", filters.requirementId)
    if (filters?.controlId) query = query.eq("control_id", filters.controlId)
    if (filters?.evidenceType) query = query.eq("evidence_type", filters.evidenceType)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      logger.error("[EvidenceRepository] findMany error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(EvidenceMapper.fromDb)
  }

  async findById(id: string): Promise<Evidence | null> {
    logger.debug("[EvidenceRepository] findById", { id })

    let query = this.supabase.from("evidence").select("*").eq("id", id)
    query = this.withTenantFilter(query)

    const { data, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") {
        logger.debug("[EvidenceRepository] findById not found", { id })
        return null
      }
      logger.error("[EvidenceRepository] findById error", { error })
      throw new Error(error.message)
    }

    return EvidenceMapper.fromDb(data)
  }

  async findByCompliance(complianceId: string): Promise<Evidence[]> {
    logger.debug("[EvidenceRepository] findByCompliance", { complianceId })

    let query = this.supabase.from("evidence").select("*").eq("compliance_record_id", complianceId)
    query = this.withTenantFilter(query)

    const { data, error } = await query

    if (error) {
      logger.error("[EvidenceRepository] findByCompliance error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(EvidenceMapper.fromDb)
  }

  async findByControl(controlId: string): Promise<Evidence[]> {
    logger.debug("[EvidenceRepository] findByControl", { controlId })

    let query = this.supabase.from("evidence").select("*").eq("control_id", controlId)
    query = this.withTenantFilter(query)

    const { data, error } = await query

    if (error) {
      logger.error("[EvidenceRepository] findByControl error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(EvidenceMapper.fromDb)
  }

  async create(data: any): Promise<Evidence> {
    logger.debug("[EvidenceRepository] create", { data })

    const dbData = EvidenceMapper.toDb(data)
    
    console.error('[EvidenceRepository] ========== MAPPING ==========')
    console.error('[EvidenceRepository] Input data.evidenceTypeId:', data.evidenceTypeId)
    console.error('[EvidenceRepository] Mapped dbData.evidence_type_id:', dbData.evidence_type_id)

    const insertData = { 
      ...dbData, 
      tenant_id: data.tenantId || this.tenantId,
      evidence_type_id: data.evidenceTypeId || dbData.evidence_type_id || null  // ✅ Приоритет: data > dbData > null
    }
    
    console.error('[EvidenceRepository] ========== FINAL INSERT DATA ==========')
    console.error('[EvidenceRepository] insertData.evidence_type_id:', insertData.evidence_type_id)
    console.error('[EvidenceRepository] Full insertData keys:', Object.keys(insertData))
    console.error('[EvidenceRepository] Will insert:', {
      evidence_type_id: insertData.evidence_type_id,
      isNull: insertData.evidence_type_id === null,
      isUndefined: insertData.evidence_type_id === undefined,
      type: typeof insertData.evidence_type_id
    })

    const { data: created, error } = await this.supabase
      .from("evidence")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error("[EvidenceRepository] create error", { error })
      throw new Error(error.message)
    }

    return EvidenceMapper.fromDb(created)
  }

  async update(id: string, data: any): Promise<Evidence> {
    logger.debug("[EvidenceRepository] update", { id, data })

    const dbData = EvidenceMapper.toDb(data)

    const { data: updated, error } = await this.supabase.from("evidence").update(dbData).eq("id", id).select().single()

    if (error) {
      logger.error("[EvidenceRepository] update error", { error })
      throw new Error(error.message)
    }

    return EvidenceMapper.fromDb(updated)
  }

  async delete(id: string): Promise<void> {
    logger.debug("[EvidenceRepository] delete", { id })

    const { error } = await this.supabase.from("evidence").delete().eq("id", id)

    if (error) {
      logger.error("[EvidenceRepository] delete error", { error })
      throw new Error(error.message)
    }
  }

  async findByControlMeasure(controlMeasureId: string): Promise<Evidence[]> {
    logger.debug("[EvidenceRepository] findByControlMeasure", { controlMeasureId })

    let query = this.supabase
      .from("control_measure_evidence")
      .select(
        `
        evidence_id,
        notes,
        relevance_score,
        evidence:evidence_id (*)
      `,
      )
      .eq("control_measure_id", controlMeasureId)
    query = this.withTenantFilter(query)

    const { data, error } = await query

    if (error) {
      logger.error("[EvidenceRepository] findByControlMeasure error", { error })
      throw new Error(error.message)
    }

    return (data || []).map((item: any) => {
      const evidence = EvidenceMapper.fromDb(item.evidence)
      // Add link metadata
      return {
        ...evidence,
        linkNotes: item.notes,
        relevanceScore: item.relevance_score,
      }
    })
  }
}
