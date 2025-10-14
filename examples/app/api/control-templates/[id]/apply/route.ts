/**
 * @intent: API endpoint for applying control template
 * @llm-note: POST /api/control-templates/[id]/apply - create control from template
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ControlTemplateService } from "@/lib/services/control-template-service"
import type { ApplyTemplateDTO } from "@/types/domain/control-template"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: templateId } = params
    const body = await request.json()

    const dto: ApplyTemplateDTO = {
      templateId,
      tenantId: body.tenantId,
      code: body.code,
      title: body.title,
      description: body.description,
      owner: body.owner,
      ownerId: body.ownerId,
      requirementIds: body.requirementIds,
      createdBy: user.id,
    }

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const control = await service.applyTemplate(ctx, dto)

    return NextResponse.json({ data: control }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to apply control template:", error)
    const message = error instanceof Error ? error.message : "Failed to apply control template"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
