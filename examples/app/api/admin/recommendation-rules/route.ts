/**
 * API Route: Recommendation Rules CRUD
 * 
 * GET /api/admin/recommendation-rules - List all rules
 * POST /api/admin/recommendation-rules - Create new rule
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[API] Recommendation Rules: Loading", { userId: user.id, tenantId: user.tenantId })

    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get("active") === "true"

    let query = supabase
      .from("recommendation_rules")
      .select("*")
      .eq("tenant_id", user.tenantId || "")
      .order("sort_order", { ascending: true })

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data: rules, error } = await query

    if (error) {
      console.error("[API] Recommendation Rules: Query error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API] Recommendation Rules: Loaded", { count: rules?.length || 0 })

    return NextResponse.json({ data: rules })
  } catch (error: any) {
    console.error("[API] Recommendation Rules: Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // TODO: Add role check (admin, ciso, etc.)
    
    const body = await request.json()
    
    console.log("[API] Recommendation Rules: Creating", { userId: user.id, code: body.code })

    const supabase = await createServerClient()

    const { data: rule, error } = await supabase
      .from("recommendation_rules")
      .insert({
        ...body,
        tenant_id: user.tenantId,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Recommendation Rules: Insert error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API] Recommendation Rules: Created", { id: rule.id })

    return NextResponse.json({ data: rule })
  } catch (error: any) {
    console.error("[API] Recommendation Rules: Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

