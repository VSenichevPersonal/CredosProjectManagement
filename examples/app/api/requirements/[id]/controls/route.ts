import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseProvider } from "@/providers/database-provider"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDatabaseProvider()
    const requirementControls = await db.requirementControls.findByRequirement(params.id)

    // Get full control details for each mapping
    const controlsWithDetails = await Promise.all(
      requirementControls.map(async (rc) => {
        const control = await db.controls.findById(rc.controlId)
        return {
          ...rc,
          control,
        }
      }),
    )

    return NextResponse.json({ data: controlsWithDetails })
  } catch (error) {
    console.error("Failed to fetch requirement controls:", error)
    return NextResponse.json({ error: "Failed to fetch requirement controls" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const db = getDatabaseProvider()

    const requirementControl = await db.requirementControls.create({
      requirementId: params.id,
      controlId: body.controlId,
      mappingType: body.mappingType || "direct",
      coveragePercentage: body.coveragePercentage,
      mappingNotes: body.mappingNotes,
      createdBy: body.createdBy,
    })

    return NextResponse.json({ data: requirementControl }, { status: 201 })
  } catch (error) {
    console.error("Failed to create requirement control:", error)
    return NextResponse.json({ error: "Failed to create requirement control" }, { status: 500 })
  }
}
