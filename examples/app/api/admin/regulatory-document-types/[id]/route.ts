import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { createServerClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const { data, error } = await supabase
      .from("regulatory_document_types")
      .update({
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        sort_order: body.sortOrder,
        is_active: body.isActive,
      })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating regulatory document type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in PATCH /api/admin/regulatory-document-types/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Check if it's a system type
    const { data: docType } = await supabase
      .from("regulatory_document_types")
      .select("is_system")
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .single()

    if (docType?.is_system) {
      return NextResponse.json({ error: "Cannot delete system document type" }, { status: 400 })
    }

    const { error } = await supabase
      .from("regulatory_document_types")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)

    if (error) {
      console.error("[v0] Error deleting regulatory document type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/admin/regulatory-document-types/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
