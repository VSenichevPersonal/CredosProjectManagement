/**
 * @intent: Business logic for risk management
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { Risk, RiskMitigation, CreateRiskDTO, CreateMitigationDTO } from "@/types/domain/risk"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class RiskService {
  /**
   * @intent: List risks accessible to current user
   * @precondition: ctx.user is authenticated
   * @postcondition: returns risks user has access to
   */
  static async list(
    ctx: ExecutionContext,
    filters?: { organizationId?: string; status?: string; riskLevel?: string },
  ): Promise<Risk[]> {
    ctx.logger.info("[v0] RiskService.list", { filters })

    // Check permission
    await ctx.access.require(Permission.RISK_READ)

    // Filter by accessible organizations if not super_admin
    const enhancedFilters = { ...filters }
    if (ctx.user?.role !== "super_admin" && ctx.organizationId && ctx.getSubordinateOrganizations) {
      const organizationIds = await ctx.getSubordinateOrganizations()
      if (!enhancedFilters.organizationId) {
        // If no specific org filter, limit to accessible orgs
        const risks = await ctx.db.risks.findMany(enhancedFilters)
        return risks.filter((r) => organizationIds.includes(r.organizationId))
      } else {
        // Verify user has access to requested org
        if (!organizationIds.includes(enhancedFilters.organizationId)) {
          throw new Error("Access denied to this organization")
        }
      }
    }

    const risks = await ctx.db.risks.findMany(enhancedFilters)

    ctx.logger.info("[v0] Risks fetched", { count: risks.length })
    return risks
  }

  /**
   * @intent: Get risk by ID
   * @precondition: ctx.user has read permission and access to organization
   * @postcondition: returns risk or throws error
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<Risk> {
    ctx.logger.info("[v0] RiskService.getById", { id })

    // Check permission
    await ctx.access.require(Permission.RISK_READ)

    const risk = await ctx.db.risks.findById(id)
    if (!risk) {
      throw new NotFoundError("Risk")
    }

    // Check organization access
    if (!(await ctx.access.canAccessOrganization(risk.organizationId))) {
      throw new Error("Access denied to this organization")
    }

    return risk
  }

  /**
   * @intent: Create risk
   * @precondition: user has create permission and access to organization
   * @postcondition: risk created
   */
  static async create(ctx: ExecutionContext, data: CreateRiskDTO): Promise<Risk> {
    ctx.logger.info("[v0] RiskService.create", { data })

    // Check permission
    await ctx.access.require(Permission.RISK_CREATE)

    // Check organization access
    if (!(await ctx.access.canAccessOrganization(data.organizationId))) {
      throw new Error("Access denied to this organization")
    }

    const risk = await ctx.db.risks.create(data)

    // Audit log
    await ctx.audit.log({
      eventType: "risk_created",
      userId: ctx.user!.id,
      resourceType: "risk",
      resourceId: risk.id,
      changes: data,
    })

    ctx.logger.info("[v0] Risk created", { riskId: risk.id })
    return risk
  }

  /**
   * @intent: Update risk
   * @precondition: user has update permission and access to organization
   * @postcondition: risk updated
   */
  static async update(ctx: ExecutionContext, id: string, data: Partial<Risk>): Promise<Risk> {
    ctx.logger.info("[v0] RiskService.update", { id, data })

    // Check permission
    await ctx.access.require(Permission.RISK_UPDATE)

    // Verify risk exists and check access
    const existing = await ctx.db.risks.findById(id)
    if (!existing) {
      throw new NotFoundError("Risk")
    }

    if (!(await ctx.access.canAccessOrganization(existing.organizationId))) {
      throw new Error("Access denied to this organization")
    }

    const updated = await ctx.db.risks.update(id, data)

    // Audit log
    await ctx.audit.log({
      eventType: "risk_updated",
      userId: ctx.user!.id,
      resourceType: "risk",
      resourceId: id,
      changes: data,
    })

    ctx.logger.info("[v0] Risk updated", { riskId: id })
    return updated
  }

  /**
   * @intent: Delete risk
   * @precondition: user has delete permission and access to organization
   * @postcondition: risk deleted
   */
  static async delete(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info("[v0] RiskService.delete", { id })

    // Check permission
    await ctx.access.require(Permission.RISK_DELETE)

    // Verify risk exists and check access
    const existing = await ctx.db.risks.findById(id)
    if (!existing) {
      throw new NotFoundError("Risk")
    }

    if (!(await ctx.access.canAccessOrganization(existing.organizationId))) {
      throw new Error("Access denied to this organization")
    }

    await ctx.db.risks.delete(id)

    // Audit log
    await ctx.audit.log({
      eventType: "risk_deleted",
      userId: ctx.user!.id,
      resourceType: "risk",
      resourceId: id,
    })

    ctx.logger.info("[v0] Risk deleted", { riskId: id })
  }

  /**
   * @intent: Get mitigations for a risk
   * @precondition: user has read permission
   * @postcondition: returns mitigations
   */
  static async getMitigations(ctx: ExecutionContext, riskId: string): Promise<RiskMitigation[]> {
    ctx.logger.info("[v0] RiskService.getMitigations", { riskId })

    // Check permission
    await ctx.access.require(Permission.RISK_READ)

    // Verify risk exists and check access
    const risk = await ctx.db.risks.findById(riskId)
    if (!risk) {
      throw new NotFoundError("Risk")
    }

    if (!(await ctx.access.canAccessOrganization(risk.organizationId))) {
      throw new Error("Access denied to this organization")
    }

    return ctx.db.riskMitigations.findByRisk(riskId)
  }

  /**
   * @intent: Create mitigation for a risk
   * @precondition: user has update permission
   * @postcondition: mitigation created
   */
  static async createMitigation(ctx: ExecutionContext, data: CreateMitigationDTO): Promise<RiskMitigation> {
    ctx.logger.info("[v0] RiskService.createMitigation", { data })

    // Check permission
    await ctx.access.require(Permission.RISK_UPDATE)

    // Verify risk exists and check access
    const risk = await ctx.db.risks.findById(data.riskId)
    if (!risk) {
      throw new NotFoundError("Risk")
    }

    if (!(await ctx.access.canAccessOrganization(risk.organizationId))) {
      throw new Error("Access denied to this organization")
    }

    const mitigation = await ctx.db.riskMitigations.create(data)

    // Audit log
    await ctx.audit.log({
      eventType: "risk_mitigation_created",
      userId: ctx.user!.id,
      resourceType: "risk_mitigation",
      resourceId: mitigation.id,
      metadata: { riskId: data.riskId },
      changes: data,
    })

    ctx.logger.info("[v0] Risk mitigation created", { mitigationId: mitigation.id })
    return mitigation
  }
}
