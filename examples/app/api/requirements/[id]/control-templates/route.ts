import { NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext()

    const requirement = await ctx.db.requirements.findById(params.id)

    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 })
    }

    const templateIds =
      requirement.suggestedControlMeasureTemplateIds || requirement.suggested_control_measure_template_ids || []

    if (templateIds.length === 0) {
      return NextResponse.json({
        data: [],
        meta: { total: 0 },
      })
    }

    const templates = await ctx.db.controlMeasureTemplates.findMany({
      filters: { id: { in: templateIds } },
    })

    const formattedTemplates = templates.map((template) => ({
      id: template.id,
      templateId: template.id,
      template: template,
    }))

    return NextResponse.json({
      data: formattedTemplates,
      meta: { total: formattedTemplates.length },
    })
  } catch (error) {
    console.error("[v0] [GET Requirement Control Templates] Error:", error)
    return handleApiError(error)
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext()
    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    const requirement = await ctx.db.requirements.findById(params.id)

    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 })
    }

    const currentIds =
      requirement.suggestedControlMeasureTemplateIds || requirement.suggested_control_measure_template_ids || []

    if (currentIds.includes(templateId)) {
      return NextResponse.json({ error: "Template already added" }, { status: 400 })
    }

    const updatedIds = [...currentIds, templateId]

    await ctx.db.requirements.update(params.id, {
      suggested_control_measure_template_ids: updatedIds,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] [POST Requirement Control Template] Error:", error)
    return handleApiError(error)
  }
}
