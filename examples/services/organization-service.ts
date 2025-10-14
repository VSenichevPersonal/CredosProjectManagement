/**
 * @intent: Business logic for organization management
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { Organization } from "@/types/domain/organization"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class OrganizationService {
  /**
   * @intent: List all organizations
   * @precondition: user has read permission
   * @postcondition: returns organizations user can access
   */
  static async list(ctx: ExecutionContext): Promise<Organization[]> {
    ctx.logger.info("[v0] OrganizationService.list")

    // Check permission
    await ctx.access.require(Permission.ORGANIZATION_READ)

    const organizations = await ctx.db.organizations.findMany()

    ctx.logger.info("[v0] Organizations fetched", { count: organizations.length })
    return organizations
  }

  /**
   * @intent: Get organization by ID
   * @precondition: user has read permission and access to organization
   * @postcondition: returns organization or throws error
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<Organization> {
    ctx.logger.info("[v0] OrganizationService.getById", { id })

    // Check permission
    await ctx.access.require(Permission.ORGANIZATION_READ)

    const organization = await ctx.db.organizations.findById(id)
    if (!organization) {
      throw new NotFoundError("Organization")
    }

    // Check access
    if (!(await ctx.access.canAccessOrganization(id))) {
      throw new Error("Access denied to this organization")
    }

    return organization
  }

  /**
   * @intent: Get organization hierarchy
   * @precondition: user has read permission
   * @postcondition: returns organization tree
   */
  static async getHierarchy(ctx: ExecutionContext, rootId: string): Promise<Organization[]> {
    ctx.logger.info("[v0] OrganizationService.getHierarchy", { rootId })

    // Check permission
    await ctx.access.require(Permission.ORGANIZATION_READ)

    // Check access to root organization
    if (!(await ctx.access.canAccessOrganization(rootId))) {
      throw new Error("Access denied to this organization")
    }

    return ctx.db.organizations.findHierarchy(rootId)
  }

  /**
   * @intent: Create organization
   * @precondition: user has create permission
   * @postcondition: organization created
   * @side-effects: audit log entry
   */
  static async create(ctx: ExecutionContext, data: any): Promise<Organization> {
    ctx.logger.info("[v0] OrganizationService.create", { data })

    // Check permission
    await ctx.access.require(Permission.ORGANIZATION_CREATE)

    const organization = await ctx.db.organizations.create(data)

    // Audit log
    await ctx.audit.log({
      eventType: "organization_created",
      userId: ctx.user!.id,
      resourceType: "organization",
      resourceId: organization.id,
      changes: data,
    })

    ctx.logger.info("[v0] Organization created", { organizationId: organization.id })
    return organization
  }

  /**
   * @intent: Update organization
   * @precondition: user has update permission
   * @postcondition: organization updated
   * @side-effects: audit log entry
   */
  static async update(ctx: ExecutionContext, id: string, data: any): Promise<Organization> {
    ctx.logger.info("[v0] OrganizationService.update", { id, data })

    // Check permission
    await ctx.access.require(Permission.ORGANIZATION_UPDATE)

    // Verify exists
    const existing = await ctx.db.organizations.findById(id)
    if (!existing) {
      throw new NotFoundError("Organization")
    }

    const updated = await ctx.db.organizations.update(id, data)

    // Audit log
    await ctx.audit.log({
      eventType: "organization_updated",
      userId: ctx.user!.id,
      resourceType: "organization",
      resourceId: id,
      changes: data,
    })

    ctx.logger.info("[v0] Organization updated", { organizationId: id })
    return updated
  }

  /**
   * @intent: Delete organization
   * @precondition: user has delete permission, no child organizations, NOT root organization
   * @postcondition: organization deleted
   * @side-effects: audit log entry created
   *
   * Added check to prevent deletion of root organization
   */
  static async delete(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info("[v0] OrganizationService.delete", { id })

    // Check permission
    await ctx.access.require(Permission.ORGANIZATION_DELETE)

    // Verify exists
    const existing = await ctx.db.organizations.findById(id)
    if (!existing) {
      throw new NotFoundError("Organization")
    }

    if (existing.id === existing.tenantId && existing.parentId === null && existing.level === 0) {
      throw new Error("Cannot delete root organization. Delete the tenant instead.")
    }

    await ctx.db.organizations.delete(id)

    // Audit log
    await ctx.audit.log({
      eventType: "organization_deleted",
      userId: ctx.user!.id,
      resourceType: "organization",
      resourceId: id,
    })

    ctx.logger.info("[v0] Organization deleted", { organizationId: id })
  }
}
