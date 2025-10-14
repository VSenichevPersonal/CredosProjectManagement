import { createContext } from "@/lib/context/create-context"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const ctx = await createContext()

    console.log("[v0] [Users Stats API] Fetching stats for tenant:", ctx.tenantId)

    const supabase = await createServerClient()

    // Get all users for tenant
    let query = supabase.from("users").select("id, is_active, role")

    if (ctx.tenantId) {
      query = query.eq("tenant_id", ctx.tenantId)
    }

    const { data: users, error } = await query

    if (error) {
      console.error("[v0] [Users Stats API] Error:", error)
      throw error
    }

    const total = users?.length || 0
    const active = users?.filter((u) => u.is_active).length || 0
    const inactive = total - active
    const admins =
      users?.filter((u) => u.role === "super_admin" || u.role === "regulator_admin" || u.role === "ib_manager")
        .length || 0

    const stats = {
      total,
      active,
      inactive,
      admins,
    }

    console.log("[v0] [Users Stats API] Stats:", stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}
