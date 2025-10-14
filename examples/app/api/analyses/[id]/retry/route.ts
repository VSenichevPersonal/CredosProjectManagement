import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseProvider } from "@/providers/database-provider"
import { DocumentAnalysisService } from "@/services/document-analysis-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDatabaseProvider()
    const service = new DocumentAnalysisService(db)

    const analysis = await service.retryAnalysis("user-id", params.id)

    return NextResponse.json({ data: analysis })
  } catch (error) {
    console.error("[Analysis Retry API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
