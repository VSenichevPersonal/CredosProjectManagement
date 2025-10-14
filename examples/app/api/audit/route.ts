import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: auditLogs, error } = await supabase
      .from("audit_log")
      .select(
        `
        *,
        user:users(name, email, organization_id)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(1000)

    if (error) {
      console.error("[API] Error fetching audit logs:", error)
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    return NextResponse.json({ data: auditLogs || [] })
  } catch (error: any) {
    console.error("[API] Error in audit logs endpoint:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
