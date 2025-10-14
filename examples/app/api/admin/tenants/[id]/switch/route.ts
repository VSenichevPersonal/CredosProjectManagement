/**
 * Admin Tenant Switch API
 *
 * Endpoint for super_admin to switch tenant context
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { createServerClient } from "@/lib/supabase/server"

/**
 * POST /api/admin/tenants/[id]/switch
 * Switch super_admin to work in context of specified tenant
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    // Verify tenant exists
    const { data: tenant, error } = await supabase.from("tenants").select("id, name, slug").eq("id", params.id).single()

    if (error || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Update user's current tenant context (temporary switch)
    // Note: This doesn't change the user's tenant_id in DB, just session context
    const { error: updateError } = await supabase.from("users").update({ tenant_id: params.id }).eq("id", ctx.user.id)

    if (updateError) {
      console.error("[API] Error switching tenant:", updateError)
      return NextResponse.json({ error: "Failed to switch tenant" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    })
  } catch (error) {
    console.error("[API] Error switching tenant:", error)
    return NextResponse.json({ error: "Failed to switch tenant" }, { status: 500 })
  }
}
