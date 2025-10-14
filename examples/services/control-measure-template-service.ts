import type { ExecutionContext } from "@/types/context"
import type { ControlMeasureTemplate } from "@/types/domain/control"
import { logger } from "@/lib/logger"

export class ControlMeasureTemplateService {
  static async list(ctx: ExecutionContext, filters?: any): Promise<ControlMeasureTemplate[]> {
    logger.trace("[ControlMeasureTemplateService] list", { filters })

    // Check permission
    if (!ctx.hasPermission("control:read")) {
      throw new Error("Insufficient permissions")
    }

    return await ctx.db.controlMeasureTemplates.findMany(filters)
  }

  static async create(ctx: ExecutionContext, data: any): Promise<ControlMeasureTemplate> {
    logger.trace("[ControlMeasureTemplateService] create", { data })

    // Check permission
    if (!ctx.hasPermission("control:create")) {
      throw new Error("Insufficient permissions")
    }

    const template = await ctx.db.controlMeasureTemplates.create({
      ...data,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
    })

    logger.info("[ControlMeasureTemplateService] Template created", { id: template.id })
    return template
  }

  static async update(ctx: ExecutionContext, id: string, data: any): Promise<ControlMeasureTemplate> {
    logger.trace("[ControlMeasureTemplateService] update", { id, data })

    if (!ctx.hasPermission("control:update")) {
      throw new Error("Insufficient permissions")
    }

    return await ctx.db.controlMeasureTemplates.update(id, data)
  }

  static async delete(ctx: ExecutionContext, id: string): Promise<void> {
    logger.trace("[ControlMeasureTemplateService] delete", { id })

    if (!ctx.hasPermission("control:delete")) {
      throw new Error("Insufficient permissions")
    }

    await ctx.db.controlMeasureTemplates.delete(id)
  }
}
