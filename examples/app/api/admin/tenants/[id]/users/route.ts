/**
 * Admin Tenant Users API
 *
 * Endpoints for managing tenant users (super_admin only)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { createServerClient } from "@/lib/supabase/server"
import { TenantManagementService } from "@/lib/services/tenant-management-service"
import type { AddTenantUserDto } from "@/types/domain/tenant"

/**
 * GET /api/admin/tenants/[id]/users
 * Get all users of a tenant
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const tenantService = new TenantManagementService(supabase)

    const users = await tenantService.getTenantUsers(params.id)

    return NextResponse.json(users)
  } catch (error) {
    console.error("[API] Error fetching tenant users:", error)
    return NextResponse.json({ error: "Failed to fetch tenant users" }, { status: 500 })
  }
}

/**
 * POST /api/admin/tenants/[id]/users
 * Add user to tenant
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const body = (await request.json()) as AddTenantUserDto

    // Validate required fields
    if (!body.userId || !body.role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 })
    }

    const tenantService = new TenantManagementService(supabase)

    const tenantUser = await tenantService.addUserToTenant(params.id, body, ctx.user.id)

    return NextResponse.json(tenantUser, { status: 201 })
  } catch (error) {
    console.error("[API] Error adding user to tenant:", error)
    return NextResponse.json({ error: "Failed to add user to tenant" }, { status: 500 })
  }
}
