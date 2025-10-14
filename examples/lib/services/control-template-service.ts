/**
 * @intent: Control Template Service - Business logic for control templates
 * @llm-note: Manages control templates (типовые меры) and their recommendations
 * @architecture: DDD Service Layer with ExecutionContext
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type {
  ControlTemplate,
  RequirementControlTemplate,
  TemplateRecommendation,
  CreateControlTemplateDTO,
  UpdateControlTemplateDTO,
  ApplyTemplateDTO,
  LinkTemplateToRequirementDTO,
  ControlTemplateFilters,
} from "@/types/domain/control-template"
import type { Control } from "@/types/domain/control"
import { Permission } from "@/lib/access-control/permissions"

/**
 * @intent: Service for managing control templates
 * @llm-note: Handles CRUD operations and template application logic
 */
export class ControlTemplateService {
  /**
   * @intent: Get all control templates with optional filters
   */
  async findTemplates(ctx: ExecutionContext, filters?: ControlTemplateFilters): Promise<ControlTemplate[]> {
    ctx.logger.info("Finding control templates", { filters })

    const templates = await ctx.db.controlMeasureTemplates.findMany(filters)

    await ctx.audit.log({
      action: "control_template.list",
      entityType: "control_template",
      entityId: null,
      userId: ctx.user?.id,
      metadata: { filters, count: templates.length },
    })

    return templates
  }

  /**
   * @intent: Get template by ID
   */
  async getTemplateById(ctx: ExecutionContext, templateId: string): Promise<ControlTemplate | null> {
    ctx.logger.info("Getting control template", { templateId })

    const template = await ctx.db.controlMeasureTemplates.findById(templateId)

    if (!template) {
      ctx.logger.warn("Control template not found", { templateId })
      return null
    }

    return template
  }

  /**
   * @intent: Get recommended templates for a requirement
   * @llm-note: Returns templates linked to requirement with priority and rationale
   */
  async getRecommendedTemplates(ctx: ExecutionContext, requirementId: string): Promise<TemplateRecommendation[]> {
    ctx.logger.info("Getting recommended templates", { requirementId })

    const recommendations = await ctx.db.controlMeasureTemplates.findByRequirement(requirementId)

    await ctx.audit.log({
      action: "control_template.recommendations_viewed",
      entityType: "requirement",
      entityId: requirementId,
      userId: ctx.user?.id,
      metadata: { count: recommendations.length },
    })

    return recommendations
  }

  /**
   * @intent: Create new control template
   * @llm-note: Only integrators can create templates
   */
  async createTemplate(ctx: ExecutionContext, dto: CreateControlTemplateDTO): Promise<ControlTemplate> {
    ctx.logger.info("Creating control template", { code: dto.code })

    const canCreate = await ctx.access.can(Permission.CONTROL_TEMPLATE_CREATE)
    if (!canCreate) {
      throw new Error("Insufficient permissions to create control template")
    }

    const template = await ctx.db.controlMeasureTemplates.create({
      ...dto,
      createdBy: ctx.user?.id,
    })

    await ctx.audit.log({
      action: "control_template.created",
      entityType: "control_template",
      entityId: template.id,
      userId: ctx.user?.id,
      metadata: { code: template.code, title: template.title },
    })

    ctx.logger.info("Control template created", { templateId: template.id })

    return template
  }

  /**
   * @intent: Update control template
   */
  async updateTemplate(
    ctx: ExecutionContext,
    templateId: string,
    dto: UpdateControlTemplateDTO,
  ): Promise<ControlTemplate> {
    ctx.logger.info("Updating control template", { templateId })

    const canUpdate = await ctx.access.can(Permission.CONTROL_TEMPLATE_UPDATE)
    if (!canUpdate) {
      throw new Error("Insufficient permissions to update control template")
    }

    const template = await ctx.db.controlMeasureTemplates.update(templateId, dto)

    await ctx.audit.log({
      action: "control_template.updated",
      entityType: "control_template",
      entityId: templateId,
      userId: ctx.user?.id,
      metadata: { changes: dto },
    })

    ctx.logger.info("Control template updated", { templateId })

    return template
  }

  /**
   * @intent: Delete control template
   */
  async deleteTemplate(ctx: ExecutionContext, templateId: string): Promise<void> {
    ctx.logger.info("Deleting control template", { templateId })

    const canDelete = await ctx.access.can(Permission.CONTROL_TEMPLATE_DELETE)
    if (!canDelete) {
      throw new Error("Insufficient permissions to delete control template")
    }

    await ctx.db.controlMeasureTemplates.delete(templateId)

    await ctx.audit.log({
      action: "control_template.deleted",
      entityType: "control_template",
      entityId: templateId,
      userId: ctx.user?.id,
    })

    ctx.logger.info("Control template deleted", { templateId })
  }

  /**
   * @intent: Apply template to create a control
   * @llm-note: Creates a control from template with optional customization
   */
  async applyTemplate(ctx: ExecutionContext, dto: ApplyTemplateDTO): Promise<Control> {
    ctx.logger.info("Applying control template", { templateId: dto.templateId })

    // Get template
    const template = await ctx.db.controlMeasureTemplates.findById(dto.templateId)
    if (!template) {
      throw new Error(`Control template not found: ${dto.templateId}`)
    }

    const canCreate = await ctx.access.can(Permission.CONTROL_CREATE)
    if (!canCreate) {
      throw new Error("Insufficient permissions to create control")
    }

    // Create control from template
    const control = await ctx.db.controls.create({
      tenantId: dto.tenantId,
      code: dto.code || template.code,
      title: dto.title || template.title,
      description: dto.description || template.description,
      category: template.category,
      controlType: template.controlType,
      frequency: template.frequency,
      isAutomated: template.isAutomated,
      implementationGuide: template.implementationGuide,
      testingProcedure: template.testingProcedure,
      owner: dto.owner,
      ownerId: dto.ownerId,
      status: "active",
      createdBy: dto.createdBy || ctx.user?.id,
    })

    // Link control to requirements if specified
    if (dto.requirementIds && dto.requirementIds.length > 0) {
      for (const requirementId of dto.requirementIds) {
        const templateLinks = await ctx.db.requirementControlTemplates.findByRequirement(requirementId)
        const templateLink = templateLinks.find((link) => link.controlTemplateId === dto.templateId)
        const isOptional = !templateLink?.isRecommended // Optional if not recommended

        await ctx.db.requirementControls.create({
          requirementId,
          controlId: control.id,
          mappingType: "direct",
          coveragePercentage: 100,
          mappingNotes: `Created from template: ${template.title}`,
          isOptional, // Set is_optional based on template recommendation
          createdBy: ctx.user?.id,
        })
      }
    }

    await ctx.audit.log({
      action: "control_template.applied",
      entityType: "control",
      entityId: control.id,
      userId: ctx.user?.id,
      metadata: {
        templateId: template.id,
        templateCode: template.code,
        requirementIds: dto.requirementIds,
      },
    })

    ctx.logger.info("Control template applied", {
      templateId: template.id,
      controlId: control.id,
    })

    return control
  }

  /**
   * @intent: Link template to requirement as recommendation
   * @llm-note: Creates recommendation relationship between requirement and template
   */
  async linkTemplateToRequirement(
    ctx: ExecutionContext,
    dto: LinkTemplateToRequirementDTO,
  ): Promise<RequirementControlTemplate> {
    ctx.logger.info("Linking template to requirement", {
      requirementId: dto.requirementId,
      templateId: dto.controlTemplateId,
    })

    const canLink = await ctx.access.can(Permission.REQUIREMENT_UPDATE)
    if (!canLink) {
      throw new Error("Insufficient permissions to link template to requirement")
    }

    const link = await ctx.db.requirementControlTemplates.create({
      requirementId: dto.requirementId,
      controlTemplateId: dto.controlTemplateId,
      priority: dto.priority ?? 50,
      rationale: dto.rationale,
      isRecommended: dto.isRecommended ?? true, // Default to true if not specified
      createdBy: dto.createdBy || ctx.user?.id,
    })

    await ctx.audit.log({
      action: "control_template.linked_to_requirement",
      entityType: "requirement_control_template",
      entityId: link.id,
      userId: ctx.user?.id,
      metadata: {
        requirementId: dto.requirementId,
        templateId: dto.controlTemplateId,
        priority: dto.priority,
        isRecommended: dto.isRecommended, // Added to audit log
      },
    })

    ctx.logger.info("Template linked to requirement", { linkId: link.id })

    return link
  }

  /**
   * @intent: Unlink template from requirement
   */
  async unlinkTemplateFromRequirement(ctx: ExecutionContext, linkId: string): Promise<void> {
    ctx.logger.info("Unlinking template from requirement", { linkId })

    const canUnlink = await ctx.access.can(Permission.REQUIREMENT_UPDATE)
    if (!canUnlink) {
      throw new Error("Insufficient permissions to unlink template from requirement")
    }

    await ctx.db.requirementControlTemplates.delete(linkId)

    await ctx.audit.log({
      action: "control_template.unlinked_from_requirement",
      entityType: "requirement_control_template",
      entityId: linkId,
      userId: ctx.user?.id,
    })

    ctx.logger.info("Template unlinked from requirement", { linkId })
  }

  /**
   * @intent: Get all templates linked to a requirement
   */
  async getTemplatesByRequirement(ctx: ExecutionContext, requirementId: string): Promise<RequirementControlTemplate[]> {
    ctx.logger.info("Getting templates by requirement", { requirementId })

    const links = await ctx.db.requirementControlTemplates.findByRequirement(requirementId)

    return links
  }

  /**
   * @intent: Get all requirements linked to a template
   */
  async getRequirementsByTemplate(ctx: ExecutionContext, templateId: string): Promise<RequirementControlTemplate[]> {
    ctx.logger.info("Getting requirements by template", { templateId })

    const links = await ctx.db.requirementControlTemplates.findByTemplate(templateId)

    return links
  }

  /**
   * @intent: Bulk apply templates to multiple requirements
   * @llm-note: Useful for applying standard controls to a set of requirements
   */
  async bulkApplyTemplates(
    ctx: ExecutionContext,
    templateIds: string[],
    requirementIds: string[],
    tenantId: string,
  ): Promise<Control[]> {
    ctx.logger.info("Bulk applying templates", {
      templateCount: templateIds.length,
      requirementCount: requirementIds.length,
    })

    const canCreate = await ctx.access.can(Permission.CONTROL_CREATE)
    if (!canCreate) {
      throw new Error("Insufficient permissions to create controls")
    }

    const createdControls: Control[] = []

    for (const templateId of templateIds) {
      const control = await this.applyTemplate(ctx, {
        templateId,
        tenantId,
        requirementIds,
        createdBy: ctx.user?.id,
      })
      createdControls.push(control)
    }

    await ctx.audit.log({
      action: "control_template.bulk_applied",
      entityType: "control",
      entityId: null,
      userId: ctx.user?.id,
      metadata: {
        templateIds,
        requirementIds,
        controlsCreated: createdControls.length,
      },
    })

    ctx.logger.info("Bulk template application completed", {
      controlsCreated: createdControls.length,
    })

    return createdControls
  }
}
