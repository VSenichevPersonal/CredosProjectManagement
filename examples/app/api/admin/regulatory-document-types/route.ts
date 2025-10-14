/**
 * Admin Regulatory Document Types API
 *
 * Endpoints for managing regulatory document types (admin only)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { createServerClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/regulatory-document-types
 * Get all document types for current tenant
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[v0] [Document Types API] Starting GET request")

    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    console.log("[v0] [Document Types API] Context created", {
      hasUser: !!ctx.user,
      userId: ctx.user?.id,
      role: ctx.user?.role,
      tenantId: ctx.tenantId,
    })

    if (!ctx.user) {
      console.log("[v0] [Document Types API] No user - returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = ctx.user.role === "super_admin" || ctx.user.role === "regulator_admin"
    console.log("[v0] [Document Types API] Admin check", { role: ctx.user.role, isAdmin })

    if (!isAdmin) {
      console.log("[v0] [Document Types API] Not admin - returning 403")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log("[v0] [Document Types API] Querying database", {
      tenantId: ctx.tenantId,
    })

    const { data, error } = await supabase
      .from("regulatory_document_types")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .order("sort_order", { ascending: true })

    console.log("[v0] [Document Types API] Query result", {
      hasData: !!data,
      dataLength: data?.length,
      hasError: !!error,
      error: error,
    })

    if (error) {
      console.error("[v0] [Document Types API] Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] [Document Types API] Returning data", { count: data.length })
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] [Document Types API] Caught exception:", error)
    console.error("[v0] [Document Types API] Error stack:", error instanceof Error ? error.stack : "No stack")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/regulatory-document-types
 * Create new document type
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] [Document Types API] Starting POST request")

    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    if (!ctx.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = ctx.user.role === "super_admin" || ctx.user.role === "regulator_admin"
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[v0] [Document Types API] Request body", { code: body.code, name: body.name })

    const { data, error } = await supabase
      .from("regulatory_document_types")
      .insert({
        tenant_id: ctx.tenantId,
        code: body.code,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        sort_order: body.sortOrder || 0,
        is_active: true,
        is_system: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] [Document Types API] Error creating document type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] [Document Types API] Document type created", { id: data.id })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] [Document Types API] Error in POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
