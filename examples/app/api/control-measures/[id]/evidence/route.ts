/**
 * @intent: Get all evidence linked to a control measure
 * @llm-note: Returns evidence with link metadata
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { EvidenceLinkService } from "@/services/evidence-link-service"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const links = await EvidenceLinkService.findByControlMeasure(ctx, params.id)

    return Response.json({ data: links })
  } catch (error) {
    return handleApiError(error)
  }
}
