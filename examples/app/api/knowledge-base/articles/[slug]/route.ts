import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createServerClient()

    const { data: article, error } = await supabase
      .from("legal_articles")
      .select("*, users(full_name)")
      .eq("slug", params.slug)
      .eq("published", true)
      .single()

    if (error || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Increment views
    await supabase
      .from("legal_articles")
      .update({ views: article.views + 1 })
      .eq("id", article.id)

    return NextResponse.json({ article })
  } catch (error) {
    console.error("[v0] KB article error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
