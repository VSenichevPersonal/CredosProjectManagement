import type { SupabaseClient } from "@supabase/supabase-js"
import type { ControlMeasureEvidence } from "@/types/domain/control-measure"
import { logger } from "@/lib/logger"

export class ControlMeasureEvidenceRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {
    logger.info("[ControlMeasureEvidenceRepository] Initialized", { tenantId })
  }

  private withTenantFilter(query: any) {
    return query.eq("tenant_id", this.tenantId)
  }

  async findByControlMeasure(controlMeasureId: string): Promise<ControlMeasureEvidence[]> {
    logger.debug("[ControlMeasureEvidenceRepository] findByControlMeasure", { controlMeasureId })

    let query = this.supabase.from("control_measure_evidence").select("*").eq("control_measure_id", controlMeasureId)
    query = this.withTenantFilter(query)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      logger.error("[ControlMeasureEvidenceRepository] findByControlMeasure error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(this.fromDb)
  }

  async findByEvidence(evidenceId: string): Promise<ControlMeasureEvidence[]> {
    logger.debug("[ControlMeasureEvidenceRepository] findByEvidence", { evidenceId })

    let query = this.supabase.from("control_measure_evidence").select("*").eq("evidence_id", evidenceId)
    query = this.withTenantFilter(query)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      logger.error("[ControlMeasureEvidenceRepository] findByEvidence error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(this.fromDb)
  }

  async link(data: {
    controlMeasureId: string
    evidenceId: string
    notes?: string
    relevanceScore?: number
    createdBy?: string
  }): Promise<ControlMeasureEvidence> {
    logger.debug("[ControlMeasureEvidenceRepository] link", { data })

    const { data: created, error } = await this.supabase
      .from("control_measure_evidence")
      .insert({
        tenant_id: this.tenantId,
        control_measure_id: data.controlMeasureId,
        evidence_id: data.evidenceId,
        notes: data.notes,
        relevance_score: data.relevanceScore,
        created_by: data.createdBy,
      })
      .select()
      .single()

    if (error) {
      logger.error("[ControlMeasureEvidenceRepository] link error", { error })
      throw new Error(error.message)
    }

    return this.fromDb(created)
  }

  async unlink(controlMeasureId: string, evidenceId: string): Promise<void> {
    logger.debug("[ControlMeasureEvidenceRepository] unlink", { controlMeasureId, evidenceId })

    const { error } = await this.supabase
      .from("control_measure_evidence")
      .delete()
      .eq("control_measure_id", controlMeasureId)
      .eq("evidence_id", evidenceId)

    if (error) {
      logger.error("[ControlMeasureEvidenceRepository] unlink error", { error })
      throw new Error(error.message)
    }
  }

  async updateLink(
    controlMeasureId: string,
    evidenceId: string,
    data: { notes?: string; relevanceScore?: number },
  ): Promise<ControlMeasureEvidence> {
    logger.debug("[ControlMeasureEvidenceRepository] updateLink", { controlMeasureId, evidenceId, data })

    const { data: updated, error } = await this.supabase
      .from("control_measure_evidence")
      .update({
        notes: data.notes,
        relevance_score: data.relevanceScore,
      })
      .eq("control_measure_id", controlMeasureId)
      .eq("evidence_id", evidenceId)
      .select()
      .single()

    if (error) {
      logger.error("[ControlMeasureEvidenceRepository] updateLink error", { error })
      throw new Error(error.message)
    }

    return this.fromDb(updated)
  }

  private fromDb(data: any): ControlMeasureEvidence {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      controlMeasureId: data.control_measure_id,
      evidenceId: data.evidence_id,
      notes: data.notes,
      relevanceScore: data.relevance_score,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}
