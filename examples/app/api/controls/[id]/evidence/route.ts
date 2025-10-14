import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseProvider } from "@/providers/database-provider"

/**
 * GET /api/controls/[id]/evidence
 * Получить все доказательства, связанные с мерой защиты
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDatabaseProvider()

    // Fetch control-evidence mappings
    const mappings = await db.controlEvidence.findByControl(params.id)

    // Fetch evidence details
    const evidenceWithDetails = await Promise.all(
      mappings.map(async (mapping) => {
        const evidence = await db.evidence.findById(mapping.evidenceId)
        return {
          ...mapping,
          evidence,
        }
      }),
    )

    return NextResponse.json({ data: evidenceWithDetails })
  } catch (error) {
    console.error("Failed to fetch control evidence:", error)
    return NextResponse.json({ error: "Failed to fetch control evidence" }, { status: 500 })
  }
}
