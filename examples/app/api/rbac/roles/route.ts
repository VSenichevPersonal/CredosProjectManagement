import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: roles, error } = await supabase
      .from("roles")
      .select(
        `
        id,
        name,
        description,
        is_system,
        users:users(count),
        role_permissions:role_permissions(count)
      `,
      )
      .eq("is_active", true)
      .order("is_system", { ascending: false })
      .order("name")

    if (error) {
      console.error("[v0] Failed to fetch roles:", error)
      return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
    }

    // Transform data
    const transformedRoles = roles?.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.is_system,
      usersCount: role.users?.[0]?.count || 0,
      permissionsCount: role.role_permissions?.[0]?.count || 0,
    }))

    return NextResponse.json({ data: transformedRoles })
  } catch (error) {
    console.error("[v0] Failed to fetch roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { name, description, permissions } = await request.json()

    // Create role
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .insert({
        name,
        description,
        is_system: false,
        is_active: true,
      })
      .select()
      .single()

    if (roleError) {
      console.error("[v0] Failed to create role:", roleError)
      return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
    }

    // Add permissions
    if (permissions && permissions.length > 0) {
      for (const perm of permissions) {
        const { data: permission } = await supabase
          .from("permissions")
          .select("id")
          .eq("resource_id", perm.resourceId)
          .eq("action_id", perm.actionId)
          .single()

        if (permission) {
          await supabase.from("role_permissions").insert({
            role_id: role.id,
            permission_id: permission.id,
          })
        }
      }
    }

    return NextResponse.json({ data: { id: role.id } })
  } catch (error) {
    console.error("[v0] Failed to create role:", error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
  }
}
