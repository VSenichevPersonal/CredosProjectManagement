/**
 * @intent: API endpoints for requirement control template recommendations
 * @llm-note: GET /api/requirements/[id]/templates - get recommended templates
 *            POST /api/requirements/[id]/templates - link template to requirement
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ControlTemplateService } from "@/lib/services/control-template-service"
import type { LinkTemplateToRequirementDTO } from "@/types/domain/control-template"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: requirementId } = params

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const recommendations = await service.getRecommendedTemplates(ctx, requirementId)

    return NextResponse.json({ data: recommendations })
  } catch (error) {
    console.error("[v0] Failed to fetch template recommendations:", error)
    return NextResponse.json({ error: "Failed to fetch template recommendations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: requirementId } = params
    const body = await request.json()

    const dto: LinkTemplateToRequirementDTO = {
      requirementId,
      controlTemplateId: body.controlTemplateId,
      priority: body.priority,
      rationale: body.rationale,
      createdBy: user.id,
    }

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const link = await service.linkTemplateToRequirement(ctx, dto)

    return NextResponse.json({ data: link }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to link template to requirement:", error)
    const message = error instanceof Error ? error.message : "Failed to link template to requirement"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
