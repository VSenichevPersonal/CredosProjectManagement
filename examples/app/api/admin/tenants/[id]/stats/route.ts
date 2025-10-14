/**
 * Admin Tenant Stats API
 *
 * Endpoint for getting tenant statistics (super_admin only)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { createServerClient } from "@/lib/supabase/server"
import { TenantManagementService } from "@/lib/services/tenant-management-service"

/**
 * GET /api/admin/tenants/[id]/stats
 * Get tenant statistics
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

    const stats = await tenantService.getTenantStats(params.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[API] Error fetching tenant stats:", error)
    return NextResponse.json({ error: "Failed to fetch tenant stats" }, { status: 500 })
  }
}
