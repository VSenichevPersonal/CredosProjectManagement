/**
 * @intent: Business logic for evidence management
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { Evidence } from "@/types/domain/evidence"
import type { CreateEvidenceDTO, UpdateEvidenceDTO, EvidenceFiltersDTO } from "@/types/dto/evidence-dto"
import { createEvidenceSchema, updateEvidenceSchema, evidenceFiltersSchema } from "@/types/dto/evidence-dto"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class EvidenceService {
  /**
   * @intent: List evidence accessible to current user
   * @precondition: ctx.user is authenticated
   * @postcondition: returns only evidence user has access to
   */
  static async list(ctx: ExecutionContext, filters?: EvidenceFiltersDTO): Promise<Evidence[]> {
    ctx.logger.info("[v0] EvidenceService.list", { filters })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_READ)

    if (filters) {
      evidenceFiltersSchema.parse(filters)
    }

    const evidence = await ctx.db.evidence.findMany(filters)

    ctx.logger.info("[v0] Evidence fetched", { count: evidence.length })
    return evidence
  }

  /**
   * @intent: Get evidence by ID
   * @precondition: ctx.user has read permission
   * @postcondition: returns evidence or throws NotFoundError
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<Evidence> {
    ctx.logger.info("[v0] EvidenceService.getById", { id })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_READ)

    const evidence = await ctx.db.evidence.findById(id)

    if (!evidence) {
      throw new NotFoundError("Evidence")
    }

    return evidence
  }

  /**
   * @intent: Create new evidence
   * @precondition: user has 'evidence:create' permission
   * @postcondition: evidence is created
   * @side-effects: audit log entry created
   */
  static async create(ctx: ExecutionContext, data: CreateEvidenceDTO): Promise<Evidence> {
    ctx.logger.info("[v0] EvidenceService.create", { data })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_CREATE)

    const validatedData = createEvidenceSchema.parse(data)

    const evidence = await ctx.db.evidence.create({
      ...validatedData,
      uploadedBy: ctx.user!.id,
      status: "pending",
    })

    // Audit log
    await ctx.audit.log({
      eventType: "evidence_created",
      userId: ctx.user!.id,
      resourceType: "evidence",
      resourceId: evidence.id,
      changes: data,
    })

    ctx.logger.info("[v0] Evidence created", { evidenceId: evidence.id })
    return evidence
  }

  /**
   * @intent: Update evidence
   * @precondition: user has update permission
   * @postcondition: evidence is updated
   * @side-effects: audit log entry created
   */
  static async update(ctx: ExecutionContext, id: string, data: UpdateEvidenceDTO): Promise<Evidence> {
    ctx.logger.info("[v0] EvidenceService.update", { id, data })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_UPDATE)

    const validatedData = updateEvidenceSchema.parse(data)

    const existing = await ctx.db.evidence.findById(id)
    if (!existing) {
      throw new NotFoundError("Evidence")
    }

    const evidence = await ctx.db.evidence.update(id, validatedData)

    // Audit log
    await ctx.audit.log({
      eventType: "evidence_updated",
      userId: ctx.user!.id,
      resourceType: "evidence",
      resourceId: id,
      changes: data,
    })

    ctx.logger.info("[v0] Evidence updated", { evidenceId: id })
    return evidence
  }

  /**
   * @intent: Review evidence (approve/reject)
   * @precondition: user has approve permission
   * @postcondition: evidence status updated
   * @side-effects: audit log entry created
   */
  static async review(
    ctx: ExecutionContext,
    id: string,
    status: "approved" | "rejected",
    reviewNotes?: string,
  ): Promise<Evidence> {
    ctx.logger.info("[v0] EvidenceService.review", { id, status })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_APPROVE)

    const existing = await ctx.db.evidence.findById(id)
    if (!existing) {
      throw new NotFoundError("Evidence")
    }

    const evidence = await ctx.db.evidence.update(id, {
      status,
      reviewNotes,
      reviewedBy: ctx.user!.id,
      reviewedAt: new Date(),
    })

    // Audit log
    await ctx.audit.log({
      eventType: "evidence_reviewed",
      userId: ctx.user!.id,
      resourceType: "evidence",
      resourceId: id,
      metadata: { status, reviewNotes },
    })

    ctx.logger.info("[v0] Evidence reviewed", { evidenceId: id, status })
    return evidence
  }

  /**
   * @intent: Delete evidence
   * @precondition: user has delete permission
   * @postcondition: evidence is deleted
   * @side-effects: audit log entry created
   */
  static async delete(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info("[v0] EvidenceService.delete", { id })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_DELETE)

    const existing = await ctx.db.evidence.findById(id)
    if (!existing) {
      throw new NotFoundError("Evidence")
    }

    await ctx.db.evidence.delete(id)

    // Audit log
    await ctx.audit.log({
      eventType: "evidence_deleted",
      userId: ctx.user!.id,
      resourceType: "evidence",
      resourceId: id,
    })

    ctx.logger.info("[v0] Evidence deleted", { evidenceId: id })
  }

  /**
   * @intent: Get evidence by compliance record
   * @precondition: user has read permission
   * @postcondition: returns evidence for compliance
   */
  static async getByCompliance(ctx: ExecutionContext, complianceId: string): Promise<Evidence[]> {
    ctx.logger.info("[v0] EvidenceService.getByCompliance", { complianceId })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_READ)

    return ctx.db.evidence.findByCompliance(complianceId)
  }

  /**
   * @intent: Get evidence by requirement
   * @precondition: user has read permission
   * @postcondition: returns evidence for requirement
   */
  static async getByRequirement(ctx: ExecutionContext, requirementId: string): Promise<Evidence[]> {
    ctx.logger.info("[v0] EvidenceService.getByRequirement", { requirementId })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_READ)

    return ctx.db.evidence.findMany({ requirementId })
  }

  /**
   * @intent: Get evidence by control
   * @precondition: user has read permission
   * @postcondition: returns evidence for control
   */
  static async getByControl(ctx: ExecutionContext, controlId: string): Promise<Evidence[]> {
    ctx.logger.info("[v0] EvidenceService.getByControl", { controlId })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_READ)

    return ctx.db.evidence.findByControl(controlId)
  }

  /**
   * @intent: Create evidence and link to control measures
   * @precondition: user has create permission
   * @postcondition: evidence created and linked
   * @side-effects: evidence_links created, audit log
   */
  static async createAndLink(
    ctx: ExecutionContext,
    data: CreateEvidenceDTO,
    controlMeasureIds: string[],
  ): Promise<Evidence> {
    ctx.logger.info("[v0] EvidenceService.createAndLink", { data, controlMeasureIds })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_CREATE)

    const validatedData = createEvidenceSchema.parse(data)

    const evidence = await ctx.db.evidence.create({
      ...validatedData,
      uploadedBy: ctx.user!.id,
      status: "pending",
    })

    if (controlMeasureIds && controlMeasureIds.length > 0) {
      const { EvidenceLinkService } = await import("./evidence-link-service")

      for (const measureId of controlMeasureIds) {
        try {
          await EvidenceLinkService.linkEvidenceToMeasure(ctx, evidence.id, measureId)
        } catch (error: any) {
          ctx.logger.error("[v0] Failed to link evidence to measure", {
            evidenceId: evidence.id,
            measureId,
            error: error.message,
          })
        }
      }
    }

    // Audit log
    await ctx.audit.log({
      eventType: "evidence_created",
      userId: ctx.user!.id,
      resourceType: "evidence",
      resourceId: evidence.id,
      changes: data,
      metadata: { linkedMeasures: controlMeasureIds },
    })

    ctx.logger.info("[v0] Evidence created and linked", {
      evidenceId: evidence.id,
      linkedCount: controlMeasureIds.length,
    })
    return evidence
  }

  /**
   * @intent: Link existing evidence to control measure
   * @precondition: user has update permission
   * @postcondition: evidence linked to measure
   */
  static async linkToMeasure(
    ctx: ExecutionContext,
    evidenceId: string,
    controlMeasureId: string,
    notes?: string,
  ): Promise<void> {
    ctx.logger.info("[v0] EvidenceService.linkToMeasure", { evidenceId, controlMeasureId })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_UPDATE)

    // Verify evidence exists
    const evidence = await ctx.db.evidence.findById(evidenceId)
    if (!evidence) {
      throw new NotFoundError("Evidence")
    }

    const { EvidenceLinkService } = await import("./evidence-link-service")
    await EvidenceLinkService.linkEvidenceToMeasure(ctx, evidenceId, controlMeasureId, notes)

    // Audit log
    await ctx.audit.log({
      eventType: "evidence_linked",
      userId: ctx.user!.id,
      resourceType: "evidence",
      resourceId: evidenceId,
      metadata: { controlMeasureId, notes },
    })

    ctx.logger.info("[v0] Evidence linked to measure", { evidenceId, controlMeasureId })
  }

  /**
   * @intent: Unlink evidence from control measure
   * @precondition: user has update permission
   * @postcondition: evidence unlinked from measure
   */
  static async unlinkFromMeasure(ctx: ExecutionContext, evidenceId: string, controlMeasureId: string): Promise<void> {
    ctx.logger.info("[v0] EvidenceService.unlinkFromMeasure", { evidenceId, controlMeasureId })

    // Check permission
    await ctx.access.require(Permission.EVIDENCE_UPDATE)

    const { EvidenceLinkService } = await import("./evidence-link-service")
    await EvidenceLinkService.unlinkEvidenceFromMeasure(ctx, evidenceId, controlMeasureId)

    // Audit log
    await ctx.audit.log({
      eventType: "evidence_unlinked",
      userId: ctx.user!.id,
      resourceType: "evidence",
      resourceId: evidenceId,
      metadata: { controlMeasureId },
    })

    ctx.logger.info("[v0] Evidence unlinked from measure", { evidenceId, controlMeasureId })
  }
}
