import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseProvider } from "@/providers/database-provider"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const db = getDatabaseProvider()

    const updated = await db.organizationTypes.update(params.id, body)

    if (!updated) {
      return NextResponse.json({ error: "Organization type not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[v0] Failed to update organization type:", error)
    return NextResponse.json({ error: "Failed to update organization type" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDatabaseProvider()

    const deleted = await db.organizationTypes.delete(params.id)

    if (!deleted) {
      return NextResponse.json({ error: "Organization type not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete organization type:", error)
    return NextResponse.json({ error: "Failed to delete organization type" }, { status: 500 })
  }
}
