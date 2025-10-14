/**
 * @intent: Business logic for compliance tracking
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { Compliance } from "@/types/domain/compliance"
import type { CreateComplianceDTO, UpdateComplianceDTO, ComplianceFilters } from "@/types/dto/compliance-dto"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class ComplianceService {
  /**
   * @intent: List compliance records accessible to current user
   * @precondition: ctx.user is authenticated
   * @postcondition: returns only compliance records user has access to
   */
  static async list(ctx: ExecutionContext, filters?: ComplianceFilters): Promise<Compliance[]> {
    ctx.logger.info("[v0] ComplianceService.list", { filters })

    // Check permission
    await ctx.access.require(Permission.COMPLIANCE_READ)

    const enhancedFilters = { ...filters }
    if (ctx.user?.role !== "super_admin" && ctx.organizationId && ctx.getSubordinateOrganizations) {
      const organizationIds = await ctx.getSubordinateOrganizations()
      enhancedFilters.organizationIds = organizationIds
      delete enhancedFilters.organizationId // Remove single org filter
    }

    const compliance = await ctx.db.compliance.findMany(enhancedFilters)

    ctx.logger.info("[v0] Compliance records fetched", { count: compliance.length })
    return compliance
  }

  /**
   * @intent: Get compliance by ID
   * @precondition: ctx.user has read permission and access to organization
   * @postcondition: returns compliance or throws error
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<Compliance> {
    ctx.logger.info("[v0] ComplianceService.getById", { id })

    // Check permission
    await ctx.access.require(Permission.COMPLIANCE_READ)

    const compliance = await ctx.db.compliance.findById(id)
    if (!compliance) {
      throw new NotFoundError("Compliance")
    }

    // Check organization access
    if (!(await ctx.access.canAccessOrganization(compliance.organizationId))) {
      throw new Error("Access denied to this organization")
    }

    // Load requirement with regulatory framework
    if (compliance.requirementId) {
      try {
        const requirement = await ctx.db.requirements.findById(compliance.requirementId)
        if (requirement) {
          compliance.requirement = requirement
          console.log("[v0] [ComplianceService.getById] Loaded requirement", {
            requirementId: requirement.id,
            code: requirement.code,
            hasSuggestedTemplates: !!requirement.suggestedControlMeasureTemplateIds,
            templateCount: requirement.suggestedControlMeasureTemplateIds?.length || 0,
            hasRegulatoryFramework: !!requirement.regulatoryFramework,
          })
        }
      } catch (error: any) {
        console.error("[v0] [ComplianceService.getById] Failed to load requirement", {
          requirementId: compliance.requirementId,
          error: error.message,
        })
      }
    }

    // Load organization
    if (compliance.organizationId) {
      try {
        const organization = await ctx.db.organizations.findById(compliance.organizationId)
        if (organization) {
          compliance.organization = organization
          console.log("[v0] [ComplianceService.getById] Loaded organization", {
            organizationId: organization.id,
            name: organization.name,
          })
        }
      } catch (error: any) {
        console.error("[v0] [ComplianceService.getById] Failed to load organization", {
          organizationId: compliance.organizationId,
          error: error.message,
        })
      }
    }

    return compliance
  }

  /**
   * @intent: Get compliance by organization
   * @precondition: user has access to organization
   * @postcondition: returns compliance records for organization
   */
  static async getByOrganization(ctx: ExecutionContext, organizationId: string): Promise<Compliance[]> {
    ctx.logger.info("[v0] ComplianceService.getByOrganization", { organizationId })

    // Check permission
    await ctx.access.require(Permission.COMPLIANCE_READ)

    // Check organization access
    if (!(await ctx.access.canAccessOrganization(organizationId))) {
      throw new Error("Access denied to this organization")
    }

    return ctx.db.compliance.findByOrganization(organizationId)
  }

  /**
   * @intent: Create compliance record with control measures from templates
   * @precondition: user has update permission
   * @postcondition: compliance record created with measures
   */
  static async create(ctx: ExecutionContext, data: CreateComplianceDTO): Promise<Compliance> {
    console.log("[v0] [ComplianceService.create] START", { data })
    ctx.logger.info("[v0] ComplianceService.create", { data })

    // Check permission
    await ctx.access.require(Permission.COMPLIANCE_UPDATE)

    // Check organization access
    if (!(await ctx.access.canAccessOrganization(data.organizationId))) {
      throw new Error("Access denied to this organization")
    }

    console.log("[v0] [ComplianceService.create] Creating compliance record")
    const compliance = await ctx.db.compliance.create(data)
    console.log("[v0] [ComplianceService.create] Compliance record created", { complianceId: compliance.id })

    console.log("[v0] [ComplianceService.create] Fetching requirement", { requirementId: data.requirementId })
    const requirement = await ctx.db.requirements.findById(data.requirementId)
    console.log("[v0] [ComplianceService.create] Requirement fetched", {
      requirementId: requirement?.id,
      hasSuggestedTemplates: !!requirement?.suggestedControlMeasureTemplateIds,
      templateCount: requirement?.suggestedControlMeasureTemplateIds?.length || 0,
      measureMode: requirement?.measureMode,
    })

    if (requirement?.suggestedControlMeasureTemplateIds && requirement.suggestedControlMeasureTemplateIds.length > 0) {
      ctx.logger.info("[v0] Creating control measures from templates", {
        complianceId: compliance.id,
        templateIds: requirement.suggestedControlMeasureTemplateIds,
        measureMode: requirement.measureMode,
      })

      const { ControlMeasureService } = await import("./control-measure-service")

      for (const templateId of requirement.suggestedControlMeasureTemplateIds) {
        try {
          console.log("[v0] [ComplianceService.create] Creating measure from template", { templateId })
          await ControlMeasureService.createFromTemplate(
            ctx,
            compliance.id,
            templateId,
            requirement.measureMode === "strict",
          )
          console.log("[v0] [ComplianceService.create] Measure created successfully", { templateId })
        } catch (error: any) {
          console.error("[v0] [ComplianceService.create] Failed to create measure from template", {
            templateId,
            error: error.message,
            stack: error.stack,
          })
          ctx.logger.error("[v0] Failed to create measure from template", {
            templateId,
            error: error.message,
          })
        }
      }
    } else {
      console.log("[v0] [ComplianceService.create] No suggested templates to create measures from")
    }

    // Audit log
    await ctx.audit.log({
      eventType: "compliance_created",
      userId: ctx.user!.id,
      resourceType: "compliance",
      resourceId: compliance.id,
      changes: data,
    })

    ctx.logger.info("[v0] Compliance created", { complianceId: compliance.id })
    console.log("[v0] [ComplianceService.create] END", { complianceId: compliance.id })
    return compliance
  }

  /**
   * @intent: Update compliance record
   * @precondition: user can edit compliance
   * @postcondition: compliance updated
   * @side-effects: audit log, status change notifications
   */
  static async update(ctx: ExecutionContext, id: string, data: UpdateComplianceDTO): Promise<Compliance> {
    ctx.logger.info("[v0] ComplianceService.update", { id, data })

    // Check if user can edit this compliance
    if (!(await ctx.access.canEditCompliance(id))) {
      throw new Error("Access denied to edit this compliance")
    }

    // Get existing compliance
    const existing = await ctx.db.compliance.findById(id)
    if (!existing) {
      throw new NotFoundError("Compliance")
    }

    // Update compliance
    const updated = await ctx.db.compliance.update(id, data)

    // Audit log for status changes
    if (data.status && data.status !== existing.status) {
      await ctx.audit.logComplianceStatusChanged(id, ctx.user!.id, existing.status, data.status)
    }

    ctx.logger.info("[v0] Compliance updated", { complianceId: id })
    return updated
  }

  /**
   * @intent: Assign requirement to multiple organizations
   * @precondition: user has assign permission
   * @postcondition: compliance records created for each organization
   * @side-effects: notifications sent to organizations
   */
  static async assignRequirementToOrganizations(
    ctx: ExecutionContext,
    requirementId: string,
    organizationIds: string[],
  ): Promise<void> {
    console.log("[v0] [ComplianceService] assignRequirementToOrganizations START", {
      requirementId,
      organizationIds,
      userId: ctx.user?.id,
      tenantId: ctx.tenantId,
    })

    ctx.logger.info("[v0] ComplianceService.assignRequirementToOrganizations", {
      requirementId,
      organizationIds,
    })

    console.log("[v0] [ComplianceService] Checking permission REQUIREMENT_ASSIGN")
    try {
      await ctx.access.require(Permission.REQUIREMENT_ASSIGN)
      console.log("[v0] [ComplianceService] Permission check passed")
    } catch (error: any) {
      console.error("[v0] [ComplianceService] Permission check failed", { error: error.message })
      throw error
    }

    console.log("[v0] [ComplianceService] Verifying requirement exists", { requirementId })
    const requirement = await ctx.db.requirements.findById(requirementId)
    if (!requirement) {
      console.error("[v0] [ComplianceService] Requirement not found", { requirementId })
      throw new NotFoundError("Requirement")
    }
    console.log("[v0] [ComplianceService] Requirement found", {
      requirementId,
      code: requirement.code,
      hasSuggestedTemplates: !!requirement.suggestedControlMeasureTemplateIds,
      templateCount: requirement.suggestedControlMeasureTemplateIds?.length || 0,
      measureMode: requirement.measureMode,
    })

    const results = []
    const skipped = []

    for (const orgId of organizationIds) {
      try {
        console.log("[v0] [ComplianceService] Creating compliance record", { orgId, requirementId })
        const compliance = await ctx.db.compliance.create({
          requirementId,
          organizationId: orgId,
          status: "pending" as const,
        })
        console.log("[v0] [ComplianceService] Compliance record created", { complianceId: compliance.id, orgId })
        results.push(compliance)
      } catch (error: any) {
        if (error.message?.includes("duplicate key") || error.message?.includes("23505")) {
          console.log("[v0] [ComplianceService] Compliance record already exists, will check for measures", { orgId })

          const { data: existingCompliance } = await ctx.db.supabase
            .from("compliance_records")
            .select("id")
            .eq("requirement_id", requirementId)
            .eq("organization_id", orgId)
            .single()

          if (existingCompliance) {
            console.log("[v0] [ComplianceService] Found existing compliance record", {
              complianceId: existingCompliance.id,
            })
            results.push(existingCompliance)
          }
          skipped.push(orgId)
        } else {
          console.error("[v0] [ComplianceService] Failed to create compliance for org", {
            orgId,
            error: error.message,
            stack: error.stack,
          })
          ctx.logger.error("[v0] Failed to create compliance for org", { orgId, error: error.message })
        }
      }
    }

    if (requirement.suggestedControlMeasureTemplateIds && requirement.suggestedControlMeasureTemplateIds.length > 0) {
      console.log("[v0] [ComplianceService] Creating control measures for all compliance records", {
        complianceCount: results.length,
        templateCount: requirement.suggestedControlMeasureTemplateIds.length,
      })

      const { ControlMeasureService } = await import("./control-measure-service")

      for (const compliance of results) {
        const { data: existingMeasures } = await ctx.db.supabase
          .from("control_measures")
          .select("id")
          .eq("compliance_record_id", compliance.id)
          .limit(1)

        if (existingMeasures && existingMeasures.length > 0) {
          console.log("[v0] [ComplianceService] Measures already exist for compliance, skipping", {
            complianceId: compliance.id,
          })
          continue
        }

        console.log("[v0] [ComplianceService] Creating measures for compliance", {
          complianceId: compliance.id,
        })

        for (const templateId of requirement.suggestedControlMeasureTemplateIds) {
          try {
            console.log("[v0] [ComplianceService] Creating measure from template", {
              complianceId: compliance.id,
              templateId,
            })
            await ControlMeasureService.createFromTemplate(
              ctx,
              compliance.id,
              templateId,
              requirement.measureMode === "strict",
            )
            console.log("[v0] [ComplianceService] Measure created successfully", { templateId })
          } catch (error: any) {
            console.error("[v0] [ComplianceService] Failed to create measure from template", {
              templateId,
              complianceId: compliance.id,
              error: error.message,
              stack: error.stack,
            })
          }
        }
      }
    } else {
      console.log("[v0] [ComplianceService] No suggested templates to create measures from")
    }

    console.log("[v0] [ComplianceService] Compliance records creation completed", {
      requested: organizationIds.length,
      created: results.length - skipped.length,
      skipped: skipped.length,
      total: results.length,
    })

    // Audit log
    await ctx.audit.log({
      eventType: "requirement_assigned",
      userId: ctx.user!.id,
      resourceType: "requirement",
      resourceId: requirementId,
      metadata: { organizationIds, created: results.length, skipped: skipped.length },
    })

    ctx.logger.info("[v0] Requirement assigned to organizations", {
      requirementId,
      requested: organizationIds.length,
      created: results.length,
      skipped: skipped.length,
    })

    console.log("[v0] [ComplianceService] assignRequirementToOrganizations END")
  }
}
