import { createServerClient } from "@/lib/supabase/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const ctx = await createExecutionContext()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const organizationId = searchParams.get("organizationId")

    console.log("[v0] [Users API] Fetching users", {
      tenantId: ctx.tenantId,
      role,
      organizationId,
      userId: ctx.user?.id,
    })

    const users = await ctx.db.users.getAll({
      filters: {
        ...(role && { role }),
        ...(organizationId && { organization_id: organizationId }),
      },
    })

    console.log("[v0] [Users API] Fetched users count:", users.length)

    return NextResponse.json(users)
  } catch (error) {
    console.error("[v0] [Users API] Error fetching users:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch users" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password || Math.random().toString(36).slice(-8),
      email_confirm: true,
    })

    if (authError) throw authError

    // Create user profile
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: body.email,
        name: body.name,
        role: body.role,
        organization_id: body.organization_id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
