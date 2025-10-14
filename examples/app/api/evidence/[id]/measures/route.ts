import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/execution-context"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const links = await ctx.db.controlMeasureEvidence.findByEvidence(params.id)

    return NextResponse.json({ data: links })
  } catch (error) {
    console.error("[v0] Failed to fetch evidence measures:", error)
    return NextResponse.json({ error: "Failed to fetch evidence measures" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const body = await request.json()
    const { measureIds, relevanceScore = 5 } = body

    if (!measureIds || !Array.isArray(measureIds)) {
      return NextResponse.json({ error: "measureIds array is required" }, { status: 400 })
    }

    // Link evidence to multiple measures
    const links = await Promise.all(
      measureIds.map((measureId: string) => ctx.db.controlMeasureEvidence.link(measureId, params.id, relevanceScore)),
    )

    return NextResponse.json({ data: links })
  } catch (error) {
    console.error("[v0] Failed to link evidence to measures:", error)
    return NextResponse.json({ error: "Failed to link evidence to measures" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { searchParams } = new URL(request.url)
    const measureId = searchParams.get("measureId")

    if (!measureId) {
      return NextResponse.json({ error: "measureId is required" }, { status: 400 })
    }

    await ctx.db.controlMeasureEvidence.unlink(measureId, params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to unlink evidence from measure:", error)
    return NextResponse.json({ error: "Failed to unlink evidence from measure" }, { status: 500 })
  }
}
