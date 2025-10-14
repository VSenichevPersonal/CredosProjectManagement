import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user" // Fixed import path

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ results: { requirements: [], organizations: [], articles: [] } })
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Search requirements
    const { data: requirements } = await supabase
      .from("requirements")
      .select("id, code, title, category")
      .eq("tenant_id", user.tenantId)
      .or(`code.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5)

    // Search organizations
    const { data: organizations } = await supabase
      .from("organizations")
      .select("id, name, type_id, inn")
      .eq("tenant_id", user.tenantId)
      .or(`name.ilike.%${query}%,inn.ilike.%${query}%`)
      .limit(5)

    // Search legal articles (no tenant_id - shared across tenants)
    const { data: articles } = await supabase
      .from("legal_articles")
      .select("id, title, article_number")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5)

    const results = {
      requirements: (requirements || []).map((req) => ({
        id: req.id,
        code: req.code,
        title: req.title,
        category: req.category || "Без категории",
      })),
      organizations: (organizations || []).map((org) => ({
        id: org.id,
        name: org.name,
        type: org.type_id || "Не указан",
      })),
      articles: (articles || []).map((article) => ({
        id: article.id,
        title: article.title,
        category: article.article_number || "Статья",
      })),
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[SEARCH_ERROR]", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
