/**
 * Current User API
 *
 * Returns current authenticated user information
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user details from database
    const { data: userData, error } = await supabase
      .from("users")
      .select("id, email, name, role, tenant_id, is_active")
      .eq("id", user.id)
      .single()

    if (error || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenantId: userData.tenant_id,
      isActive: userData.is_active,
    })
  } catch (error) {
    console.error("[API] Error fetching current user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
