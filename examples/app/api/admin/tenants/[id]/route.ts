/**
 * Admin Tenant Detail API
 *
 * Endpoints for individual tenant management (super_admin only)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { createServerClient } from "@/lib/supabase/server"
import { TenantManagementService } from "@/lib/services/tenant-management-service"
import type { UpdateTenantDto } from "@/types/domain/tenant"

/**
 * GET /api/admin/tenants/[id]
 * Get tenant details with optional relations
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get("includeStats") === "true"
    const includeUsers = searchParams.get("includeUsers") === "true"
    const includeAuditLog = searchParams.get("includeAuditLog") === "true"

    const tenantService = new TenantManagementService(supabase)

    const tenant = await tenantService.getTenantById(params.id, {
      includeStats,
      includeUsers,
      includeAuditLog,
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error("[API] Error fetching tenant:", error)
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/tenants/[id]
 * Update tenant
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const body = (await request.json()) as UpdateTenantDto

    const tenantService = new TenantManagementService(supabase)

    const tenant = await tenantService.updateTenant(params.id, body, ctx.user.id)

    return NextResponse.json(tenant)
  } catch (error) {
    console.error("[API] Error updating tenant:", error)
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/tenants/[id]
 * Delete tenant (soft delete - set inactive)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const tenantService = new TenantManagementService(supabase)

    // Soft delete - set status to inactive
    const tenant = await tenantService.updateTenant(params.id, { status: "inactive" }, ctx.user.id)

    return NextResponse.json(tenant)
  } catch (error) {
    console.error("[API] Error deleting tenant:", error)
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 })
  }
}
