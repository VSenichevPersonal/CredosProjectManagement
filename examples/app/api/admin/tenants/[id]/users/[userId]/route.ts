/**
 * Admin Tenant User Detail API
 *
 * Endpoints for managing individual tenant user (super_admin only)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { createServerClient } from "@/lib/supabase/server"
import { TenantManagementService } from "@/lib/services/tenant-management-service"
import type { UpdateTenantUserDto } from "@/types/domain/tenant"

/**
 * PUT /api/admin/tenants/[id]/users/[userId]
 * Update tenant user
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const body = (await request.json()) as UpdateTenantUserDto

    const tenantService = new TenantManagementService(supabase)

    const tenantUser = await tenantService.updateTenantUser(params.id, params.userId, body, ctx.user.id)

    return NextResponse.json(tenantUser)
  } catch (error) {
    console.error("[API] Error updating tenant user:", error)
    return NextResponse.json({ error: "Failed to update tenant user" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/tenants/[id]/users/[userId]
 * Remove user from tenant
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const tenantService = new TenantManagementService(supabase)

    await tenantService.removeUserFromTenant(params.id, params.userId, ctx.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error removing user from tenant:", error)
    return NextResponse.json({ error: "Failed to remove user from tenant" }, { status: 500 })
  }
}
