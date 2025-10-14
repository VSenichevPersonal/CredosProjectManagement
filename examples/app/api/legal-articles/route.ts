import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { LegalArticleService } from "@/services/legal-article-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const { searchParams } = new URL(request.url)
    const regulatoryFrameworkId = searchParams.get("regulatory_framework_id") || undefined

    const articles = await LegalArticleService.list(ctx, regulatoryFrameworkId)

    return NextResponse.json({ data: articles })
  } catch (error: any) {
    console.error("[API] Error fetching legal articles:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch legal articles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const body = await request.json()

    const article = await LegalArticleService.create(ctx, body)

    return NextResponse.json({ data: article }, { status: 201 })
  } catch (error: any) {
    console.error("[API] Error creating legal article:", error)
    return NextResponse.json({ error: error.message || "Failed to create legal article" }, { status: 500 })
  }
}
