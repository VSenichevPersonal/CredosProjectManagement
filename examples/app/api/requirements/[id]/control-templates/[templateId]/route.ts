import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { RequirementService } from "@/services/requirement-service"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; templateId: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { id: requirementId, templateId } = params

    console.log("[v0] [DELETE Control Template] Removing template:", {
      requirementId,
      templateId,
    })

    // Get current requirement using static method
    const requirement = await RequirementService.getById(ctx, requirementId)
    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 })
    }

    // Remove templateId from suggested_control_measure_template_ids
    const currentIds = requirement.suggestedControlMeasureTemplateIds || []
    const newIds = currentIds.filter((id: string) => id !== templateId)

    // Update requirement using static method
    await RequirementService.update(ctx, requirementId, {
      suggestedControlMeasureTemplateIds: newIds,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] [DELETE Control Template] Error:", error)
    return handleApiError(error)
  }
}
