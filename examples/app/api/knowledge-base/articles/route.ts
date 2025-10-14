import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams

    const category = searchParams.get("category")
    const regulator = searchParams.get("regulator")
    const requirementType = searchParams.get("requirementType")
    const search = searchParams.get("search")

    let query = supabase
      .from("legal_articles")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })

    if (category) query = query.eq("category", category)
    if (regulator) query = query.eq("regulator_id", regulator)
    if (requirementType) query = query.eq("requirement_type", requirementType)
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,tags.cs.{${search}}`)

    const { data: articles, error } = await query

    if (error) {
      console.error("[v0] Failed to fetch articles:", error)
      return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
    }

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("[v0] KB articles error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
