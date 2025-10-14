import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase.from("regulators").select("*").eq("tenant_id", user.tenantId).order("name")

    if (error) {
      console.error("[v0] Error fetching regulators:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error in regulators API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
