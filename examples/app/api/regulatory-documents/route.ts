import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: documents, error } = await supabase
      .from("regulatory_documents")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching regulatory documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error in GET /api/regulatory-documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
