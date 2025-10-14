import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseProvider } from "@/providers/database-provider"

// DELETE - удаление mapping (отмена ручного добавления или возврат исключенного)
export async function DELETE(request: NextRequest, { params }: { params: { id: string; requirementId: string } }) {
  try {
    const db = getDatabaseProvider(true)

    console.log("[v0] DELETE requirement mapping:", {
      organizationId: params.id,
      requirementId: params.requirementId,
    })

    await db.organizationRequirements.removeRequirement(params.id, params.requirementId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete requirement mapping:", error)
    return NextResponse.json({ error: "Failed to delete requirement mapping" }, { status: 500 })
  }
}

// PUT - обновление mapping (исключение требования)
export async function PUT(request: NextRequest, { params }: { params: { id: string; requirementId: string } }) {
  try {
    const db = getDatabaseProvider(true)
    const body = await request.json()

    console.log("[v0] PUT requirement mapping:", {
      organizationId: params.id,
      requirementId: params.requirementId,
      body,
    })

    if (body.mappingType === "manual_exclude") {
      await db.organizationRequirements.excludeRequirement(params.id, params.requirementId, body.reason)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update requirement mapping:", error)
    return NextResponse.json({ error: "Failed to update requirement mapping" }, { status: 500 })
  }
}
