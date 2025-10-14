import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseProvider } from "@/providers/database-provider"

/**
 * GET /api/controls/[id]/requirements
 * Получить все требования, связанные с мерой защиты
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDatabaseProvider()

    // Fetch requirement-control mappings
    const mappings = await db.requirementControls.findByControl(params.id)

    // Fetch requirement details
    const requirementsWithDetails = await Promise.all(
      mappings.map(async (mapping) => {
        const requirement = await db.requirements.findById(mapping.requirementId)
        return {
          ...mapping,
          requirement,
        }
      }),
    )

    return NextResponse.json({ data: requirementsWithDetails })
  } catch (error) {
    console.error("Failed to fetch control requirements:", error)
    return NextResponse.json({ error: "Failed to fetch control requirements" }, { status: 500 })
  }
}
