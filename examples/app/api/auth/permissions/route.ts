import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        role_id,
        roles!inner (
          id,
          name,
          role_permissions!inner (
            permissions!inner (
              id,
              code,
              resources!inner (
                code,
                name
              ),
              actions!inner (
                code,
                name
              )
            )
          )
        )
      `,
      )
      .eq("id", user.id) // Use id instead of email
      .single()

    if (userError || !userData) {
      logger.error("Failed to fetch user permissions", { userId: user.id, error: userError })
      return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
    }

    const permissions = userData.roles.role_permissions.map((rp: any) => ({
      id: rp.permissions.id,
      code: rp.permissions.code,
      resource: rp.permissions.resources.code,
      resourceName: rp.permissions.resources.name,
      action: rp.permissions.actions.code,
      actionName: rp.permissions.actions.name,
    }))

    return NextResponse.json({
      permissions,
      role: userData.roles.name,
      roleId: userData.role_id,
    })
  } catch (error) {
    logger.error("Error fetching permissions", { error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
