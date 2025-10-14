/**
 * @intent: API endpoints for single control template
 * @llm-note: GET /api/control-templates/[id] - get template by ID
 *            PUT /api/control-templates/[id] - update template
 *            DELETE /api/control-templates/[id] - delete template
 *            PATCH /api/control-templates/[id] - update template partially
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ControlTemplateService } from "@/lib/services/control-template-service"
import { handleApiError } from "@/lib/utils/errors"
import type { UpdateControlTemplateDTO } from "@/types/domain/control-template"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const template = await service.getTemplateById(ctx, id)

    if (!template) {
      return NextResponse.json({ error: "Control template not found" }, { status: 404 })
    }

    return NextResponse.json({ data: template })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body: UpdateControlTemplateDTO = await request.json()

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const template = await service.updateTemplate(ctx, id, body)

    return NextResponse.json({ data: template })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const template = await service.updateTemplate(ctx, id, body)

    return NextResponse.json({ data: template })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    await service.deleteTemplate(ctx, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
