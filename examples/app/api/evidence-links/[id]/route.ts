/**
 * @intent: Delete specific evidence link
 * @llm-note: Thin controller - all logic in EvidenceLinkService
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { EvidenceLinkService } from "@/services/evidence-link-service"
import { handleApiError } from "@/lib/utils/errors"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    await EvidenceLinkService.delete(ctx, params.id)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
