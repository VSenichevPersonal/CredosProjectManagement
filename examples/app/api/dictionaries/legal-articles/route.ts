import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"

export async function GET(request: NextRequest) {
  try {
    const context = await createExecutionContext(request)

    const legalArticles = await context.db.legalArticles.findAll()

    return NextResponse.json({
      success: true,
      data: legalArticles,
    })
  } catch (error: any) {
    console.error("[v0] Legal Articles API Error:", error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 })
  }
}
