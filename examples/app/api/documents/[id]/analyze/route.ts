import { type NextRequest, NextResponse } from "next/server"
import { getDatabaseProvider } from "@/providers/database-provider"
import { DocumentAnalysisService } from "@/services/document-analysis-service"
import type { LLMProviderType } from "@/lib/providers/llm/llm-factory"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { fromVersionId, toVersionId, provider = "openai" } = body

    if (!toVersionId) {
      return NextResponse.json({ error: "toVersionId is required" }, { status: 400 })
    }

    const db = getDatabaseProvider()
    const service = new DocumentAnalysisService(db)

    const analysis = await service.analyzeDocument(
      "user-id", // TODO: Get from auth
      params.id,
      fromVersionId || null,
      toVersionId,
      provider as LLMProviderType,
    )

    return NextResponse.json({ data: analysis }, { status: 201 })
  } catch (error) {
    console.error("[Document Analysis API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDatabaseProvider()
    const service = new DocumentAnalysisService(db)

    const analyses = await service.getAnalyses("user-id", params.id)

    return NextResponse.json({ data: analyses })
  } catch (error) {
    console.error("[Document Analysis API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
