import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; controlId: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { id: requirementId, controlId } = params

    console.log("[v0] [DELETE Requirement Control] Removing control:", {
      requirementId,
      controlId,
    })

    const requirement = await ctx.db.requirements.findById(requirementId)

    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 })
    }

    const currentIds =
      requirement.suggestedControlMeasureTemplateIds || requirement.suggested_control_measure_template_ids || []

    const updatedIds = currentIds.filter((id: string) => id !== controlId)

    await ctx.db.requirements.update(requirementId, {
      suggested_control_measure_template_ids: updatedIds,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] [DELETE Requirement Control] Error:", error)
    return handleApiError(error)
  }
}
