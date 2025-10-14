/**
 * @intent: Handle single organization operations
 * @llm-note: Thin controller - all logic is in OrganizationService
 * @architecture: API Layer - context → service → response
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { OrganizationService } from "@/services/organization-service"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const organization = await OrganizationService.getById(ctx, params.id)

    return Response.json({ data: organization })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const body = await request.json()

    if (body.parent_id !== null && body.parent_id !== undefined) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(body.parent_id)) {
        return Response.json({ error: "Invalid parent_id format" }, { status: 400 })
      }
    }

    const organization = await OrganizationService.update(ctx, params.id, body)

    return Response.json({ data: organization })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const children = await ctx.db.organizations.findMany({ parentId: params.id })
    if (children && children.length > 0) {
      return Response.json({ error: "Cannot delete organization with child organizations" }, { status: 400 })
    }

    await OrganizationService.delete(ctx, params.id)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
