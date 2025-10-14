import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { SupabaseDatabaseProvider } from "@/providers/supabase-provider"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const provider = new SupabaseDatabaseProvider(supabase)
    const analyses = await provider.getDocumentAnalyses(params.id)

    return NextResponse.json({ data: analyses })
  } catch (error) {
    console.error("[v0] Get analyses error:", error)
    return NextResponse.json({ error: "Failed to fetch analyses" }, { status: 500 })
  }
}
