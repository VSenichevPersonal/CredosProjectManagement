import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await createExecutionContext(request)
    const { db } = context

    const records = await db.complianceRecords.findByRequirement(params.id)

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch compliance records:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch compliance records",
      },
      { status: 500 },
    )
  }
}
