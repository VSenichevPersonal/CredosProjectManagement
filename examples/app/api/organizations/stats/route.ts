import { createExecutionContext } from "@/lib/context/create-context"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { getAccessibleOrganizationIds } from "@/lib/auth/get-accessible-organizations"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const ctx = await createExecutionContext(request)
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] [Organizations Stats API] Fetching stats", {
      tenantId: ctx.tenantId,
      userId: user.id,
      role: user.role,
    })

    const supabase = await createServerClient()

    const accessibleIds = getAccessibleOrganizationIds(user)
    console.log("[v0] [Organizations Stats API] Accessible IDs:", accessibleIds)

    let totalQuery = supabase.from("organizations").select("*", { count: "exact", head: true })

    if (ctx.tenantId) {
      totalQuery = totalQuery.eq("tenant_id", ctx.tenantId)
    }

    if (accessibleIds !== "all") {
      if (accessibleIds.length === 0) {
        console.log("[v0] [Organizations Stats API] User has no accessible organizations")
        return NextResponse.json({ total: 0, withPdn: 0, withKii: 0 })
      }
      totalQuery = totalQuery.in("id", accessibleIds)
    }

    const { count: total } = await totalQuery

    let pdnQuery = supabase
      .from("organization_attributes")
      .select("organization_id", { count: "exact", head: true })
      .not("pdn_level", "is", null)
      .gt("pdn_level", 0)

    if (ctx.tenantId) {
      pdnQuery = pdnQuery.eq("tenant_id", ctx.tenantId)
    }

    if (accessibleIds !== "all") {
      pdnQuery = pdnQuery.in("organization_id", accessibleIds)
    }

    const { count: withPdn } = await pdnQuery

    let kiiQuery = supabase
      .from("organization_attributes")
      .select("organization_id", { count: "exact", head: true })
      .not("kii_category", "is", null)
      .gt("kii_category", 0)

    if (ctx.tenantId) {
      kiiQuery = kiiQuery.eq("tenant_id", ctx.tenantId)
    }

    if (accessibleIds !== "all") {
      kiiQuery = kiiQuery.in("organization_id", accessibleIds)
    }

    const { count: withKii } = await kiiQuery

    console.log("[v0] [Organizations Stats API] Stats fetched", {
      total,
      withPdn,
      withKii,
      accessibleCount: accessibleIds === "all" ? "all" : accessibleIds.length,
    })

    return NextResponse.json({
      total: total || 0,
      withPdn: withPdn || 0,
      withKii: withKii || 0,
    })
  } catch (error) {
    console.error("[v0] [Organizations Stats API] Error:", error)
    console.error(
      "[v0] [Organizations Stats API] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    )
    console.error("[v0] [Organizations Stats API] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
    })
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
