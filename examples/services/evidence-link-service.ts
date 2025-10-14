/**
 * @intent: Business logic for evidence-to-measure links management
 * @llm-note: Handles many-to-many relationships between evidence and control measures
 * @architecture: Service layer - enables evidence reuse across multiple measures
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError, ValidationError } from "@/lib/utils/errors"

export interface EvidenceLink {
  id: string
  evidenceId: string
  controlMeasureId?: string
  requirementId?: string
  relevanceScore?: number
  notes?: string
  createdBy: string
  createdAt: Date
}

export class EvidenceLinkService {
  /**
   * @intent: Link evidence to control measure
   * @precondition: evidence and measure exist, user has permission
   * @postcondition: link created, measure completion recalculated
   */
  static async linkToMeasure(
    ctx: ExecutionContext,
    evidenceId: string,
    controlMeasureId: string,
    relevanceScore?: number,
    notes?: string,
  ): Promise<EvidenceLink> {
    ctx.logger.info("[v0] EvidenceLinkService.linkToMeasure", { evidenceId, controlMeasureId })

    await ctx.access.require(Permission.EVIDENCE_UPDATE)

    await this.validateEvidenceType(ctx, evidenceId, controlMeasureId)

    // Verify evidence exists
    const { data: evidence } = await ctx.db.supabase.from("evidence").select("id").eq("id", evidenceId).single()

    if (!evidence) {
      throw new NotFoundError("Evidence")
    }

    // Verify measure exists
    const { data: measure } = await ctx.db.supabase
      .from("control_measures")
      .select("id, requirement_id")
      .eq("id", controlMeasureId)
      .single()

    if (!measure) {
      throw new NotFoundError("Control measure")
    }

    const { data: link, error } = await ctx.db.supabase
      .from("evidence_links")
      .insert({
        evidence_id: evidenceId,
        control_measure_id: controlMeasureId,
        requirement_id: measure.requirement_id,
        relevance_score: relevanceScore || 5,
        notes,
        created_by: ctx.user!.id,
        tenant_id: ctx.tenantId,
      })
      .select()
      .single()

    if (error) throw error

    await ctx.audit.log({
      eventType: "evidence_linked",
      userId: ctx.user!.id,
      resourceType: "evidence_link",
      resourceId: link.id,
      metadata: { evidenceId, controlMeasureId },
    })

    ctx.logger.info("[v0] Evidence linked to measure", { linkId: link.id })
    return link as EvidenceLink
  }

  /**
   * @intent: Validate that evidence type is allowed for the control measure
   * @precondition: evidence and measure exist
   * @postcondition: throws error if validation fails
   */
  static async validateEvidenceType(
    ctx: ExecutionContext,
    evidenceId: string,
    controlMeasureId: string,
  ): Promise<void> {
    console.log("[v0] [EvidenceLinkService.validateEvidenceType] Validating evidence type", {
      evidenceId,
      controlMeasureId,
    })

    // Get evidence type
    const { data: evidence, error: evidenceError } = await ctx.db.supabase
      .from("evidence")
      .select("evidence_type_id, evidence_types:evidence_type_id(title)")
      .eq("id", evidenceId)
      .single()

    console.log('[EvidenceLinkService] Evidence query result:', {
      evidenceId,
      evidence_type_id: evidence?.evidence_type_id,
      hasEvidence: !!evidence,
      error: evidenceError
    })

    if (!evidence) {
      throw new NotFoundError("Evidence")
    }

    const evidenceTypeId = evidence.evidence_type_id
    const evidenceTypeName = (evidence.evidence_types as any)?.title
    
    console.log('[EvidenceLinkService] Extracted:', {
      evidenceTypeId,
      evidenceTypeName,
      isNull: evidenceTypeId === null,
      isUndefined: evidenceTypeId === undefined
    })

    // Get measure with requirement to check evidenceTypeMode
    const { data: measure } = await ctx.db.supabase
      .from("control_measures")
      .select(`
        title, 
        template_id,
        requirement_id,
        allowed_evidence_type_ids,
        requirements!inner(evidence_type_mode)
      `)
      .eq("id", controlMeasureId)
      .single()

    if (!measure) {
      throw new NotFoundError("Control measure")
    }

    const requirement = (measure as any).requirements
    const evidenceTypeMode = requirement?.evidence_type_mode || "flexible"
    const allowedTypes = (measure as any).allowed_evidence_type_ids

    console.log("[v0] [EvidenceLinkService.validateEvidenceType] Validation data", {
      evidenceTypeId,
      evidenceTypeName,
      measureTitle: (measure as any).title,
      evidenceTypeMode,
      allowedTypes,
    })

    // ✅ Умная валидация в зависимости от режима
    if (evidenceTypeMode === "strict") {
      // STRICT: Проверяем что тип доказательства разрешён
      if (!evidenceTypeId) {
        // 🔍 ДЕТАЛЬНАЯ ДИАГНОСТИКА
        console.error('[EvidenceLinkService] STRICT MODE VALIDATION FAILED:', {
          evidenceId,
          evidenceTypeId,
          evidence_raw: evidence,
          evidenceTypeMode,
          allowedTypes,
          measureTitle: (measure as any).title
        })
        
        // Прямая проверка в БД (без RLS)
        const { data: rawEvidence } = await ctx.db.supabase
          .from('evidence')
          .select('evidence_type_id')
          .eq('id', evidenceId)
          .single()
        
        console.error('[EvidenceLinkService] Raw DB check:', {
          rawEvidence,
          raw_evidence_type_id: rawEvidence?.evidence_type_id
        })
        
        throw new ValidationError(
          `Требование в строгом режиме по доказательствам. ` +
          `Необходимо указать тип доказательства при загрузке. ` +
          `DEBUG: evidenceId=${evidenceId}, typeId=${evidenceTypeId}, raw=${rawEvidence?.evidence_type_id}`
        )
      }
      
      if (allowedTypes && allowedTypes.length > 0) {
        if (!allowedTypes.includes(evidenceTypeId)) {
          throw new ValidationError(
            `Тип доказательства "${evidenceTypeName}" не разрешён для меры "${(measure as any).title}". ` +
            `Требование в строгом режиме. Разрешённые типы: ${allowedTypes.length}. ` +
            `Выберите доказательство подходящего типа.`
          )
        }
      }
    } else {
      // FLEXIBLE: Любой тип разрешён
      console.log("[v0] [EvidenceLinkService.validateEvidenceType] Flexible mode - any evidence type allowed")
    }

    console.log("[v0] [EvidenceLinkService.validateEvidenceType] Validation passed")
  }

  /**
   * @intent: Get allowed evidence types for a control measure
   * @precondition: measure exists
   * @postcondition: returns list of allowed evidence types
   */
  static async getAllowedEvidenceTypes(
    ctx: ExecutionContext,
    controlMeasureId: string,
  ): Promise<Array<{ id: string; name: string; description: string }>> {
    console.log("[v0] [EvidenceLinkService.getAllowedEvidenceTypes] Getting allowed types", { controlMeasureId })

    const { data, error } = await ctx.db.supabase.rpc("get_allowed_evidence_types_for_measure", {
      p_measure_id: controlMeasureId,
    })

    if (error) {
      console.error("[v0] Error getting allowed evidence types:", error)
      throw new Error(`Failed to get allowed evidence types: ${error.message}`)
    }

    return (
      data?.map((row: any) => ({
        id: row.evidence_type_id,
        name: row.evidence_type_name,
        description: row.evidence_type_description,
      })) || []
    )
  }

  /**
   * @intent: Link evidence to multiple measures at once
   * @precondition: evidence exists, all measures exist
   * @postcondition: multiple links created
   */
  static async linkToMultipleMeasures(
    ctx: ExecutionContext,
    evidenceId: string,
    controlMeasureIds: string[],
    relevanceScore?: number,
  ): Promise<EvidenceLink[]> {
    ctx.logger.info("[v0] EvidenceLinkService.linkToMultipleMeasures", { evidenceId, count: controlMeasureIds.length })

    await ctx.access.require(Permission.EVIDENCE_UPDATE)

    const links: EvidenceLink[] = []
    for (const measureId of controlMeasureIds) {
      try {
        const link = await this.linkToMeasure(ctx, evidenceId, measureId, relevanceScore)
        links.push(link)
      } catch (error) {
        ctx.logger.error("[v0] Failed to link evidence to measure", { measureId, error })
      }
    }

    return links
  }

  /**
   * @intent: Unlink evidence from measure
   * @precondition: link exists, user has permission
   * @postcondition: link deleted, measure completion recalculated
   */
  static async unlinkFromMeasure(ctx: ExecutionContext, evidenceId: string, controlMeasureId: string): Promise<void> {
    ctx.logger.info("[v0] EvidenceLinkService.unlinkFromMeasure", { evidenceId, controlMeasureId })

    await ctx.access.require(Permission.EVIDENCE_UPDATE)

    const { error } = await ctx.db.supabase
      .from("evidence_links")
      .delete()
      .eq("evidence_id", evidenceId)
      .eq("control_measure_id", controlMeasureId)
      .eq("tenant_id", ctx.tenantId)

    if (error) throw error

    await ctx.audit.log({
      eventType: "evidence_unlinked",
      userId: ctx.user!.id,
      resourceType: "evidence_link",
      metadata: { evidenceId, controlMeasureId },
    })

    ctx.logger.info("[v0] Evidence unlinked from measure")
  }

  /**
   * @intent: Get all measures linked to evidence
   * @precondition: user has read permission
   * @postcondition: returns measures with link details
   */
  static async getMeasuresForEvidence(ctx: ExecutionContext, evidenceId: string): Promise<any[]> {
    ctx.logger.info("[v0] EvidenceLinkService.getMeasuresForEvidence", { evidenceId })

    await ctx.access.require(Permission.EVIDENCE_READ)

    const { data: links, error } = await ctx.db.supabase
      .from("evidence_links")
      .select(`
        *,
        control_measures:control_measure_id(*)
      `)
      .eq("evidence_id", evidenceId)
      .eq("tenant_id", ctx.tenantId)

    if (error) throw error

    return links || []
  }

  /**
   * @intent: Get all evidence linked to measure
   * @precondition: user has read permission
   * @postcondition: returns evidence with link details
   */
  static async getEvidenceForMeasure(ctx: ExecutionContext, controlMeasureId: string): Promise<any[]> {
    ctx.logger.info("[v0] EvidenceLinkService.getEvidenceForMeasure", { controlMeasureId })

    await ctx.access.require(Permission.EVIDENCE_READ)

    const { data: links, error } = await ctx.db.supabase
      .from("evidence_links")
      .select(`
        *,
        evidence:evidence_id(*)
      `)
      .eq("control_measure_id", controlMeasureId)
      .eq("tenant_id", ctx.tenantId)

    if (error) throw error

    return links || []
  }

  /**
   * @intent: Get evidence reuse statistics
   * @precondition: user has read permission
   * @postcondition: returns count of measures using each evidence
   */
  static async getEvidenceReuseStats(ctx: ExecutionContext, evidenceIds: string[]): Promise<Map<string, number>> {
    const stats = new Map<string, number>()

    for (const evidenceId of evidenceIds) {
      const { count } = await ctx.db.supabase
        .from("evidence_links")
        .select("*", { count: "exact", head: true })
        .eq("evidence_id", evidenceId)
        .eq("tenant_id", ctx.tenantId)

      stats.set(evidenceId, count || 0)
    }

    return stats
  }
}
