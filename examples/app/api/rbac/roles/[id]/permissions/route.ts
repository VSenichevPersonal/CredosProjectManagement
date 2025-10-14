import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const roleId = params.id

    const { data: permissions, error } = await supabase
      .from("role_permissions")
      .select(
        `
        permissions!inner (
          id,
          resource_id,
          action_id,
          resources!inner (
            name
          ),
          actions!inner (
            name
          )
        )
      `,
      )
      .eq("role_id", roleId)

    if (error) {
      console.error("[v0] Failed to fetch role permissions:", error)
      return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
    }

    // Transform data
    const transformedPermissions = permissions?.map((rp: any) => ({
      id: rp.permissions.id,
      resourceId: rp.permissions.resource_id,
      actionId: rp.permissions.action_id,
      resourceName: rp.permissions.resources.name,
      actionName: rp.permissions.actions.name,
    }))

    return NextResponse.json({ data: transformedPermissions })
  } catch (error) {
    console.error("[v0] Failed to fetch role permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const roleId = params.id
    const { updates } = await request.json()

    for (const update of updates) {
      const { resourceId, actionId, enabled } = update

      const { data: permission } = await supabase
        .from("permissions")
        .select("id")
        .eq("resource_id", resourceId)
        .eq("action_id", actionId)
        .single()

      if (permission) {
        if (enabled) {
          await supabase.from("role_permissions").insert({
            role_id: roleId,
            permission_id: permission.id,
          })
        } else {
          await supabase.from("role_permissions").delete().eq("role_id", roleId).eq("permission_id", permission.id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update role permissions:", error)
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 })
  }
}
