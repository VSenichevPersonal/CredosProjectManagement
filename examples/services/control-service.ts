/**
 * @intent: Business logic for control management
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { Control } from "@/types/domain/control"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class ControlService {
  /**
   * @intent: List controls accessible to current user
   * @precondition: ctx.user is authenticated
   * @postcondition: returns controls user has access to
   */
  static async list(
    ctx: ExecutionContext,
    filters?: { category?: string; controlType?: string; status?: string },
  ): Promise<Control[]> {
    ctx.logger.info("[v0] ControlService.list", { filters })

    // Check permission
    await ctx.access.require(Permission.CONTROL_READ)

    const controls = await ctx.db.controls.findMany(filters)

    ctx.logger.info("[v0] Controls fetched", { count: controls.length })
    return controls
  }

  /**
   * @intent: Get control by ID
   * @precondition: ctx.user has read permission
   * @postcondition: returns control or throws error
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<Control> {
    ctx.logger.info("[v0] ControlService.getById", { id })

    // Check permission
    await ctx.access.require(Permission.CONTROL_READ)

    const control = await ctx.db.controls.findById(id)
    if (!control) {
      throw new NotFoundError("Control")
    }

    return control
  }

  /**
   * @intent: Create control
   * @precondition: user has create permission
   * @postcondition: control created
   */
  static async create(ctx: ExecutionContext, data: any): Promise<Control> {
    ctx.logger.info("[v0] ControlService.create", { data })

    // Check permission
    await ctx.access.require(Permission.CONTROL_CREATE)

    const control = await ctx.db.controls.create({
      ...data,
      tenantId: ctx.tenantId,
      createdBy: ctx.user!.id,
    })

    // Audit log
    await ctx.audit.log({
      eventType: "control_created",
      userId: ctx.user!.id,
      resourceType: "control",
      resourceId: control.id,
      changes: data,
    })

    ctx.logger.info("[v0] Control created", { controlId: control.id })
    return control
  }

  /**
   * @intent: Update control
   * @precondition: user has update permission
   * @postcondition: control updated
   */
  static async update(ctx: ExecutionContext, id: string, data: any): Promise<Control> {
    ctx.logger.info("[v0] ControlService.update", { id, data })

    // Check permission
    await ctx.access.require(Permission.CONTROL_UPDATE)

    // Verify control exists
    const existing = await ctx.db.controls.findById(id)
    if (!existing) {
      throw new NotFoundError("Control")
    }

    const updated = await ctx.db.controls.update(id, data)

    // Audit log
    await ctx.audit.log({
      eventType: "control_updated",
      userId: ctx.user!.id,
      resourceType: "control",
      resourceId: id,
      changes: data,
    })

    ctx.logger.info("[v0] Control updated", { controlId: id })
    return updated
  }

  /**
   * @intent: Delete control
   * @precondition: user has delete permission
   * @postcondition: control deleted
   */
  static async delete(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info("[v0] ControlService.delete", { id })

    // Check permission
    await ctx.access.require(Permission.CONTROL_DELETE)

    // Verify control exists
    const existing = await ctx.db.controls.findById(id)
    if (!existing) {
      throw new NotFoundError("Control")
    }

    await ctx.db.controls.delete(id)

    // Audit log
    await ctx.audit.log({
      eventType: "control_deleted",
      userId: ctx.user!.id,
      resourceType: "control",
      resourceId: id,
    })

    ctx.logger.info("[v0] Control deleted", { controlId: id })
  }
}
