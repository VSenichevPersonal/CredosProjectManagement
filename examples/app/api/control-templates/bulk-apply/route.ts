/**
 * @intent: API endpoint for bulk applying templates
 * @llm-note: POST /api/control-templates/bulk-apply - apply multiple templates to requirements
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ControlTemplateService } from "@/lib/services/control-template-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { templateIds, requirementIds, tenantId } = body

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return NextResponse.json({ error: "templateIds is required and must be a non-empty array" }, { status: 400 })
    }

    if (!requirementIds || !Array.isArray(requirementIds) || requirementIds.length === 0) {
      return NextResponse.json({ error: "requirementIds is required and must be a non-empty array" }, { status: 400 })
    }

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 })
    }

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const controls = await service.bulkApplyTemplates(ctx, templateIds, requirementIds, tenantId)

    return NextResponse.json(
      {
        data: controls,
        message: `Successfully created ${controls.length} controls from templates`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Failed to bulk apply templates:", error)
    const message = error instanceof Error ? error.message : "Failed to bulk apply templates"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
