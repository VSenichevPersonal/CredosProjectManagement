import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { handleApiError } from "@/lib/utils/errors"

// PATCH /api/requirements/[id]/legal-references/[referenceId] - Update a legal reference
export async function PATCH(request: NextRequest, { params }: { params: { id: string; referenceId: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { referenceId } = params
    const body = await request.json()

    const reference = await ctx.db.requirementLegalReferences.update(referenceId, body)

    return NextResponse.json(reference)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/requirements/[id]/legal-references/[referenceId] - Remove a legal reference
export async function DELETE(request: NextRequest, { params }: { params: { id: string; referenceId: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { referenceId } = params

    await ctx.db.requirementLegalReferences.delete(referenceId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
