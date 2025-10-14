/**
 * @intent: Business logic for control measures management
 * @llm-note: Handles control measure lifecycle - creation from templates, status updates, evidence tracking
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { ControlMeasure } from "@/types/domain/control-measure"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError, ValidationError } from "@/lib/utils/errors"
import { MasterControlService } from "./master-control-service"

export class ControlMeasureService {
  /**
   * @intent: Create control measure from template
   * @precondition: template exists, user has permission
   * @postcondition: control measure created with reference to template
   */
  static async createFromTemplate(
    ctx: ExecutionContext,
    complianceRecordId: string,
    templateId: string,
    isLocked = false,
  ): Promise<ControlMeasure> {
    console.log("[v0] [ControlMeasureService.createFromTemplate] START", {
      complianceRecordId,
      templateId,
      isLocked,
    })
    ctx.logger.info("[v0] ControlMeasureService.createFromTemplate", { complianceRecordId, templateId })

    await ctx.access.require(Permission.COMPLIANCE_UPDATE)

    await this.validateMeasureCreation(ctx, complianceRecordId, templateId)

    // Get template
    console.log("[v0] [ControlMeasureService] Fetching template", { templateId })
    const { data: template } = await ctx.db.supabase
      .from("control_measure_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (!template) {
      console.error("[v0] [ControlMeasureService] Template not found", { templateId })
      throw new NotFoundError("Control measure template")
    }
    console.log("[v0] [ControlMeasureService] Template fetched", {
      templateId,
      title: template.title,
      hasRecommendedTypes: !!template.recommended_evidence_type_ids,
      recommendedTypesCount: template.recommended_evidence_type_ids?.length || 0,
    })

    // Get compliance record to get requirement_id and organization_id
    console.log("[v0] [ControlMeasureService] Fetching compliance record", { complianceRecordId })
    const { data: compliance } = await ctx.db.supabase
      .from("compliance_records")
      .select("requirement_id, organization_id")
      .eq("id", complianceRecordId)
      .single()

    if (!compliance) {
      console.error("[v0] [ControlMeasureService] Compliance record not found", { complianceRecordId })
      throw new NotFoundError("Compliance record")
    }
    console.log("[v0] [ControlMeasureService] Compliance record fetched", {
      complianceRecordId,
      requirementId: compliance.requirement_id,
      organizationId: compliance.organization_id,
    })

    // ⭐ НОВОЕ: Найти или создать master control
    let masterControlId: string | null = null
    try {
      masterControlId = await MasterControlService.findOrCreate(
        ctx,
        compliance.organization_id,
        templateId
      )
      console.log("[v0] [ControlMeasureService] Master control:", { masterControlId })
    } catch (error) {
      console.error("[v0] [ControlMeasureService] Failed to create master control:", error)
      // Продолжаем без master (fallback)
    }

    const measureData = {
      compliance_record_id: complianceRecordId,
      requirement_id: compliance.requirement_id,
      organization_id: compliance.organization_id,
      title: template.title,
      description: template.description,
      implementation_notes: template.implementation_guide,
      allowed_evidence_type_ids: template.recommended_evidence_type_ids || [],
      status: "planned",
      from_template: true,
      template_id: templateId,
      is_locked: isLocked,
      master_control_id: masterControlId,  // ⭐ Привязка к master
      inherit_from_master: true,            // ⭐ Наследовать статус
      tenant_id: ctx.tenantId,
      created_by: ctx.user!.id,
    }

    console.log("[v0] [ControlMeasureService] Creating control measure", { measureData })

    const { data: measure, error } = await ctx.db.supabase
      .from("control_measures")
      .insert(measureData)
      .select()
      .single()

    if (error) {
      console.error("[v0] [ControlMeasureService] Failed to create measure", { error: error.message, code: error.code })
      throw error
    }

    console.log("[v0] [ControlMeasureService] Control measure created successfully", {
      measureId: measure.id,
      title: measure.title,
    })
    ctx.logger.info("[v0] Control measure created from template", { measureId: measure.id })
    return measure as ControlMeasure
  }

  /**
   * @intent: Create custom control measure (not from template)
   * @precondition: requirement is in flexible mode, user has permission
   * @postcondition: custom control measure created
   */
  static async createCustomMeasure(
    ctx: ExecutionContext,
    complianceRecordId: string,
    data: {
      title: string
      description?: string
      implementation_notes?: string // Fixed field name
    },
  ): Promise<ControlMeasure> {
    console.log("[v0] [ControlMeasureService.createCustomMeasure] START", {
      complianceRecordId,
      title: data.title,
    })
    ctx.logger.info("[v0] ControlMeasureService.createCustomMeasure", { complianceRecordId })

    await ctx.access.require(Permission.COMPLIANCE_UPDATE)

    await this.validateMeasureCreation(ctx, complianceRecordId, null)

    // Get compliance record to get requirement_id and organization_id
    const { data: compliance } = await ctx.db.supabase
      .from("compliance_records")
      .select("requirement_id, organization_id")
      .eq("id", complianceRecordId)
      .single()

    if (!compliance) {
      throw new NotFoundError("Compliance record")
    }

    const measureData = {
      compliance_record_id: complianceRecordId,
      requirement_id: compliance.requirement_id,
      organization_id: compliance.organization_id,
      title: data.title,
      description: data.description,
      implementation_notes: data.implementation_notes, // Fixed field name
      status: "planned",
      from_template: false,
      template_id: null,
      is_locked: false,
      tenant_id: ctx.tenantId,
      created_by: ctx.user!.id,
    }

    const { data: measure, error } = await ctx.db.supabase
      .from("control_measures")
      .insert(measureData)
      .select()
      .single()

    if (error) {
      console.error("[v0] [ControlMeasureService] Failed to create custom measure", {
        error: error.message,
        code: error.code,
      })
      throw error
    }

    console.log("[v0] [ControlMeasureService] Custom measure created successfully", {
      measureId: measure.id,
      title: measure.title,
    })
    ctx.logger.info("[v0] Custom control measure created", { measureId: measure.id })
    return measure as ControlMeasure
  }

  /**
   * @intent: Validate that measure creation complies with requirement mode
   * @precondition: compliance record exists
   * @postcondition: throws error if validation fails
   */
  static async validateMeasureCreation(
    ctx: ExecutionContext,
    complianceRecordId: string,
    templateId: string | null,
  ): Promise<void> {
    console.log("[v0] [ControlMeasureService.validateMeasureCreation] Validating measure mode", {
      complianceRecordId,
      templateId,
      isCustomMeasure: !templateId,
    })

    // Get requirement mode through compliance record
    const { data: compliance, error } = await ctx.db.supabase
      .from("compliance_records")
      .select("requirements(measure_mode, code)")
      .eq("id", complianceRecordId)
      .single()

    if (error || !compliance) {
      throw new NotFoundError("Compliance record")
    }

    const requirement = compliance.requirements as any
    const measureMode = requirement?.measure_mode

    console.log("[v0] [ControlMeasureService.validateMeasureCreation] Requirement mode:", {
      requirementCode: requirement?.code,
      measureMode,
    })

    // If strict mode and no template - reject
    if (measureMode === "strict" && !templateId) {
      throw new ValidationError(
        `Cannot create custom measures for requirement ${requirement.code}. ` +
          `This requirement is in strict mode and only allows template-based measures. ` +
          `Please use one of the suggested control measure templates.`,
      )
    }

    console.log("[v0] [ControlMeasureService.validateMeasureCreation] Validation passed")
  }

  /**
   * @intent: Create control measures for compliance record from requirement templates
   * @precondition: compliance record exists, requirement has suggested templates
   * @postcondition: all suggested measures created
   */
  static async createMeasuresForCompliance(
    ctx: ExecutionContext,
    complianceRecordId: string,
  ): Promise<ControlMeasure[]> {
    ctx.logger.info("[v0] ControlMeasureService.createMeasuresForCompliance", { complianceRecordId })

    await ctx.access.require(Permission.COMPLIANCE_UPDATE)

    // Get compliance record with requirement
    const { data: compliance } = await ctx.db.supabase
      .from("compliance_records")
      .select("*, requirements(*)")
      .eq("id", complianceRecordId)
      .single()

    if (!compliance) {
      throw new NotFoundError("Compliance record")
    }

    const requirement = compliance.requirements
    if (
      !requirement.suggested_control_measure_template_ids ||
      requirement.suggested_control_measure_template_ids.length === 0
    ) {
      ctx.logger.info("[v0] No suggested templates for requirement", { requirementId: requirement.id })
      return []
    }

    const measures: ControlMeasure[] = []
    for (const templateId of requirement.suggested_control_measure_template_ids) {
      try {
        const measure = await this.createFromTemplate(ctx, complianceRecordId, templateId)
        measures.push(measure)
      } catch (error) {
        ctx.logger.error("[v0] Failed to create measure from template", { templateId, error })
      }
    }

    ctx.logger.info("[v0] Created measures for compliance", { count: measures.length })
    return measures
  }

  /**
   * @intent: Get control measures for compliance record
   * @precondition: user has read permission
   * @postcondition: returns measures with linked evidence count
   */
  static async getByComplianceRecord(ctx: ExecutionContext, complianceRecordId: string): Promise<ControlMeasure[]> {
    ctx.logger.info("[v0] ControlMeasureService.getByComplianceRecord", { complianceRecordId })

    await ctx.access.require(Permission.COMPLIANCE_READ)

    const { data: measures, error } = await ctx.db.supabase
      .from("control_measures")
      .select(`
        *,
        control_measure_templates:template_id(*),
        evidence_links(count)
      `)
      .eq("compliance_record_id", complianceRecordId)
      .eq("tenant_id", ctx.tenantId)

    if (error) throw error

    return measures as ControlMeasure[]
  }

  /**
   * @intent: Update control measure status
   * @precondition: user has update permission
   * @postcondition: status updated, audit logged
   */
  static async updateStatus(
    ctx: ExecutionContext,
    measureId: string,
    status: "planned" | "in_progress" | "implemented" | "verified" | "failed",
  ): Promise<ControlMeasure> {
    ctx.logger.info("[v0] ControlMeasureService.updateStatus", { measureId, status })

    await ctx.access.require(Permission.COMPLIANCE_UPDATE)

    const { data: measure, error } = await ctx.db.supabase
      .from("control_measures")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", measureId)
      .eq("tenant_id", ctx.tenantId)
      .select()
      .single()

    if (error) throw error

    await ctx.audit.log({
      eventType: "control_measure_status_updated",
      userId: ctx.user!.id,
      resourceType: "control_measure",
      resourceId: measureId,
      metadata: { status },
    })

    return measure as ControlMeasure
  }

  /**
   * @intent: Calculate measure completion status based on evidence links
   * @precondition: measure exists with template
   * @postcondition: returns completion percentage
   */
  static async calculateCompletion(ctx: ExecutionContext, measureId: string): Promise<number> {
    const { data: measure } = await ctx.db.supabase
      .from("control_measures")
      .select("template_id, control_measure_templates!inner(recommended_evidence_type_ids)")
      .eq("id", measureId)
      .single()

    if (!measure || !measure.control_measure_templates) return 0

    const requiredTypes = measure.control_measure_templates.recommended_evidence_type_ids || []
    if (requiredTypes.length === 0) return 100

    const { data: links } = await ctx.db.supabase
      .from("evidence_links")
      .select("evidence:evidence_id(evidence_type_id)")
      .eq("control_measure_id", measureId)

    const linkedTypes = new Set(links?.map((l: any) => l.evidence?.evidence_type_id).filter(Boolean) || [])

    return Math.round((linkedTypes.size / requiredTypes.length) * 100)
  }
}
