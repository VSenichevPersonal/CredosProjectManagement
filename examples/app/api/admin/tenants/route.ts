/**
 * Admin Tenants API
 *
 * Endpoints for tenant management (super_admin only)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { createServerClient } from "@/lib/supabase/server"
import { TenantManagementService } from "@/lib/services/tenant-management-service"
import type { CreateTenantDto } from "@/types/domain/tenant"

/**
 * GET /api/admin/tenants
 * Get all tenants (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const tenantService = new TenantManagementService(supabase)

    const tenants = await tenantService.getAllTenants()

    return NextResponse.json(tenants)
  } catch (error) {
    console.error("[API] Error fetching tenants:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}

/**
 * POST /api/admin/tenants
 * Create new tenant (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    // Check super_admin permission
    if (!ctx.user || ctx.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: super_admin access required" }, { status: 403 })
    }

    const body = (await request.json()) as CreateTenantDto

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const tenantService = new TenantManagementService(supabase)

    const tenant = await tenantService.createTenant(body, ctx.user.id)

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating tenant:", error)
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 })
  }
}
