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

    // Check if user is super_admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tenants:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tenants)
  } catch (error) {
    console.error("Error in GET /api/tenants:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
