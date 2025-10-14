/**
 * @intent: Business logic for requirement management
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { Requirement } from "@/types/domain/requirement"
import type { CreateRequirementDTO, UpdateRequirementDTO, RequirementFilters } from "@/types/dto/requirement-dto"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class RequirementService {
  /**
   * @intent: List requirements accessible to current user
   * @precondition: ctx.user is authenticated
   * @postcondition: returns only requirements user has access to
   */
  static async list(ctx: ExecutionContext, filters?: RequirementFilters): Promise<Requirement[]> {
    ctx.logger.info("[v0] RequirementService.list", { filters })

    // Check permission
    await ctx.access.require(Permission.REQUIREMENT_READ)

    // Get requirements
    const requirements = await ctx.db.requirements.findMany(filters)

    ctx.logger.info("[v0] Requirements fetched", { count: requirements.length })
    return requirements
  }

  /**
   * @intent: Get requirement by ID
   * @precondition: ctx.user has read permission
   * @postcondition: returns requirement or throws NotFoundError
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<Requirement> {
    ctx.logger.info("[v0] RequirementService.getById", { id })

    // Check permission
    await ctx.access.require(Permission.REQUIREMENT_READ)

    const requirement = await ctx.db.requirements.findById(id)
    if (!requirement) {
      throw new NotFoundError("Requirement")
    }

    return requirement
  }

  /**
   * @intent: Get requirement with suggested control measure templates
   * @precondition: ctx.user has read permission
   * @postcondition: returns requirement with templates populated
   */
  static async getByIdWithTemplates(
    ctx: ExecutionContext,
    id: string,
  ): Promise<
    Requirement & {
      suggestedTemplates?: any[]
    }
  > {
    ctx.logger.info("[v0] RequirementService.getByIdWithTemplates", { id })

    // Check permission
    await ctx.access.require(Permission.REQUIREMENT_READ)

    const requirement = await ctx.db.requirements.findById(id)
    if (!requirement) {
      throw new NotFoundError("Requirement")
    }

    let suggestedTemplates = []
    if (requirement.suggestedControlMeasureTemplateIds && requirement.suggestedControlMeasureTemplateIds.length > 0) {
      suggestedTemplates = await ctx.db.controlMeasureTemplates.findMany({
        ids: requirement.suggestedControlMeasureTemplateIds,
      })
    }

    return {
      ...requirement,
      suggestedTemplates,
    }
  }

  /**
   * @intent: Create new requirement
   * @precondition: user has 'requirement:create' permission
   * @postcondition: requirement is created
   * @side-effects: audit log entry created
   */
  static async create(ctx: ExecutionContext, data: CreateRequirementDTO): Promise<Requirement> {
    ctx.logger.info("[v0] RequirementService.create", { data })

    // Check permission
    await ctx.access.require(Permission.REQUIREMENT_CREATE)

    // Business rule: expiration date must be after effective date
    if (data.effectiveDate && data.expirationDate) {
      if (new Date(data.expirationDate) <= new Date(data.effectiveDate)) {
        throw new Error("Expiration date must be after effective date")
      }
    }

    // Create requirement
    const requirement = await ctx.db.requirements.create({
      ...data,
      createdBy: ctx.user!.id,
    })

    // Audit log
    await ctx.audit.logRequirementCreated(requirement.id, ctx.user!.id, data)

    ctx.logger.info("[v0] Requirement created", { requirementId: requirement.id })
    return requirement
  }

  /**
   * @intent: Update requirement
   * @precondition: user has update permission
   * @postcondition: requirement is updated
   * @side-effects: audit log entry created
   */
  static async update(ctx: ExecutionContext, id: string, data: UpdateRequirementDTO): Promise<Requirement> {
    ctx.logger.info("[v0] RequirementService.update", { id, data })

    // Check permission
    await ctx.access.require(Permission.REQUIREMENT_UPDATE)

    // Verify requirement exists
    const existing = await ctx.db.requirements.findById(id)
    if (!existing) {
      throw new NotFoundError("Requirement")
    }

    // Update requirement
    const updated = await ctx.db.requirements.update(id, data)

    // Audit log
    await ctx.audit.log({
      eventType: "requirement_updated",
      userId: ctx.user!.id,
      resourceType: "requirement",
      resourceId: id,
      changes: data,
    })

    ctx.logger.info("[v0] Requirement updated", { requirementId: id })
    return updated
  }

  /**
   * @intent: Delete requirement
   * @precondition: user has delete permission
   * @postcondition: requirement is deleted
   * @side-effects: audit log entry created
   */
  static async delete(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info("[v0] RequirementService.delete", { id })

    // Check permission
    await ctx.access.require(Permission.REQUIREMENT_DELETE)

    // Verify requirement exists
    const existing = await ctx.db.requirements.findById(id)
    if (!existing) {
      throw new NotFoundError("Requirement")
    }

    // Delete requirement
    await ctx.db.requirements.delete(id)

    // Audit log
    await ctx.audit.log({
      eventType: "requirement_deleted",
      userId: ctx.user!.id,
      resourceType: "requirement",
      resourceId: id,
    })

    ctx.logger.info("[v0] Requirement deleted", { requirementId: id })
  }
}
