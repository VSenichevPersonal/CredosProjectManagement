/**
 * @intent: Handle individual evidence type operations
 * @architecture: API Layer - context → db → response
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { Permission } from "@/lib/access-control/permissions"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const type = await ctx.db.evidenceTypes.findById(params.id)

    if (!type) {
      return NextResponse.json({ error: "Evidence type not found" }, { status: 404 })
    }

    return NextResponse.json(type)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    await ctx.access.require(Permission.DICTIONARY_MANAGE)

    const body = await request.json()
    const updated = await ctx.db.evidenceTypes.update(params.id, body)

    await ctx.audit.log({
      eventType: "evidence_type_updated",
      userId: ctx.user!.id,
      resourceType: "evidence_type",
      resourceId: params.id,
      changes: body,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    await ctx.access.require(Permission.DICTIONARY_MANAGE)

    await ctx.db.evidenceTypes.delete(params.id)

    await ctx.audit.log({
      eventType: "evidence_type_deleted",
      userId: ctx.user!.id,
      resourceType: "evidence_type",
      resourceId: params.id,
      changes: {},
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
