import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { LegalArticleService } from "@/services/legal-article-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const article = await LegalArticleService.getById(ctx, params.id)

    if (!article) {
      return NextResponse.json({ error: "Legal article not found" }, { status: 404 })
    }

    return NextResponse.json({ data: article })
  } catch (error: any) {
    console.error("[API] Error fetching legal article:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch legal article" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const body = await request.json()

    const article = await LegalArticleService.update(ctx, params.id, body)

    return NextResponse.json({ data: article })
  } catch (error: any) {
    console.error("[API] Error updating legal article:", error)
    return NextResponse.json({ error: error.message || "Failed to update legal article" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    await LegalArticleService.delete(ctx, params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API] Error deleting legal article:", error)
    return NextResponse.json({ error: error.message || "Failed to delete legal article" }, { status: 500 })
  }
}
