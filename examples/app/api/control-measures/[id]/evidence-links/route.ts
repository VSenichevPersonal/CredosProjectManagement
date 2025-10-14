import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { EvidenceLinkService } from "@/services/evidence-link-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const evidenceLinkService = new EvidenceLinkService(ctx)

    const links = await evidenceLinkService.findByControlMeasure(params.id)

    return NextResponse.json({ data: links })
  } catch (error: any) {
    console.error("[v0] Failed to fetch evidence links:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch evidence links" }, { status: 500 })
  }
}
