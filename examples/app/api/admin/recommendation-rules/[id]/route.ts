/**
 * API Route: Single Recommendation Rule operations
 * 
 * GET /api/admin/recommendation-rules/[id] - Get rule by ID
 * PATCH /api/admin/recommendation-rules/[id] - Update rule
 * DELETE /api/admin/recommendation-rules/[id] - Delete rule
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerClient()

    const { data: rule, error } = await supabase
      .from("recommendation_rules")
      .select("*")
      .eq("id", params.id)
      .eq("tenant_id", user.tenantId || "")
      .single()

    if (error) {
      console.error("[API] Recommendation Rule: Query error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: rule })
  } catch (error: any) {
    console.error("[API] Recommendation Rule: Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    console.log("[API] Recommendation Rule: Updating", { id: params.id, userId: user.id })

    const supabase = await createServerClient()

    // Check if rule is system rule
    const { data: existing } = await supabase
      .from("recommendation_rules")
      .select("is_system_rule")
      .eq("id", params.id)
      .eq("tenant_id", user.tenantId || "")
      .single()

    if (existing?.is_system_rule) {
      // TODO: Check if user is super_admin
      console.log("[API] Recommendation Rule: System rule, checking permissions")
    }

    const { data: rule, error } = await supabase
      .from("recommendation_rules")
      .update({
        ...body,
        updated_by: user.id,
      })
      .eq("id", params.id)
      .eq("tenant_id", user.tenantId || "")
      .select()
      .single()

    if (error) {
      console.error("[API] Recommendation Rule: Update error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API] Recommendation Rule: Updated", { id: rule.id })

    return NextResponse.json({ data: rule })
  } catch (error: any) {
    console.error("[API] Recommendation Rule: Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[API] Recommendation Rule: Deleting", { id: params.id, userId: user.id })

    const supabase = await createServerClient()

    // RLS will prevent deleting system rules
    const { error } = await supabase
      .from("recommendation_rules")
      .delete()
      .eq("id", params.id)
      .eq("tenant_id", user.tenantId || "")

    if (error) {
      console.error("[API] Recommendation Rule: Delete error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API] Recommendation Rule: Deleted", { id: params.id })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API] Recommendation Rule: Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

