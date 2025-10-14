import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ControlMeasureService } from "@/services/control-measure-service"
import { Permission } from "@/lib/access-control/permissions"

/**
 * @intent: Sync control measures from requirement templates to existing compliance record
 * @use-case: When compliance record was created before measures were implemented
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Sync measures for compliance record - START", { complianceId: params.id })

    const ctx = await createExecutionContext(request)
    console.log("[v0] Context created", { userId: ctx.user?.id, tenantId: ctx.tenantId })

    // Check permission
    await ctx.access.require(Permission.COMPLIANCE_UPDATE)

    // Get compliance record
    const { data: compliance, error: complianceError } = await ctx.db.supabase
      .from("compliance_records")
      .select("id, requirement_id, organization_id")
      .eq("id", params.id)
      .single()

    if (complianceError || !compliance) {
      console.error("[v0] Compliance record not found", { complianceId: params.id, error: complianceError })
      return NextResponse.json({ error: "Compliance record not found" }, { status: 404 })
    }

    console.log("[v0] Compliance record found", { compliance })

    // Get requirement with templates
    const requirement = await ctx.db.requirements.findById(compliance.requirement_id)
    if (!requirement) {
      console.error("[v0] Requirement not found", { requirementId: compliance.requirement_id })
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 })
    }

    console.log("[v0] Requirement found", {
      requirementId: requirement.id,
      code: requirement.code,
      hasSuggestedTemplates: !!requirement.suggestedControlMeasureTemplateIds,
      templateCount: requirement.suggestedControlMeasureTemplateIds?.length || 0,
      measureMode: requirement.measureMode,
    })

    // Check if measures already exist
    const { data: existingMeasures } = await ctx.db.supabase
      .from("control_measures")
      .select("id, template_id")
      .eq("compliance_record_id", params.id)

    console.log("[v0] Existing measures", { count: existingMeasures?.length || 0 })

    if (
      !requirement.suggestedControlMeasureTemplateIds ||
      requirement.suggestedControlMeasureTemplateIds.length === 0
    ) {
      console.log("[v0] No suggested templates to create measures from")
      return NextResponse.json({
        success: true,
        message: "No template measures defined for this requirement",
        created: 0,
        existing: existingMeasures?.length || 0,
      })
    }

    // Create missing measures
    const existingTemplateIds = new Set(existingMeasures?.map((m) => m.template_id) || [])
    const templatesToCreate = requirement.suggestedControlMeasureTemplateIds.filter(
      (templateId) => !existingTemplateIds.has(templateId),
    )

    console.log("[v0] Templates to create", {
      total: requirement.suggestedControlMeasureTemplateIds.length,
      existing: existingTemplateIds.size,
      toCreate: templatesToCreate.length,
    })

    let created = 0
    for (const templateId of templatesToCreate) {
      try {
        console.log("[v0] Creating measure from template", { templateId, complianceId: params.id })
        await ControlMeasureService.createFromTemplate(ctx, params.id, templateId, requirement.measureMode === "strict")
        created++
        console.log("[v0] Measure created successfully", { templateId })
      } catch (error: any) {
        console.error("[v0] Failed to create measure from template", {
          templateId,
          error: error.message,
          stack: error.stack,
        })
      }
    }

    console.log("[v0] Sync measures completed", { created, existing: existingMeasures?.length || 0 })

    return NextResponse.json({
      success: true,
      message: `Synced ${created} measures from requirement templates`,
      created,
      existing: existingMeasures?.length || 0,
      total: (existingMeasures?.length || 0) + created,
    })
  } catch (error: any) {
    console.error("[v0] Failed to sync measures:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json(
      {
        error: error.message || "Failed to sync measures",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
