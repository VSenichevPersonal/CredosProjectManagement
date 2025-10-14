import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { tenantId } = await request.json()

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Проверяем, что пользователь аутентифицирован
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получаем данные пользователя из БД
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Проверяем, что пользователь - super_admin
    if (userData.role !== "super_admin") {
      return NextResponse.json({ error: "Only super_admin can switch tenants" }, { status: 403 })
    }

    // Проверяем, что tenant существует
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("id", tenantId)
      .eq("is_active", true)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Устанавливаем cookie с выбранным tenant
    const cookieStore = await cookies()
    cookieStore.set("selected_tenant_id", tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 дней
    })

    return NextResponse.json({
      success: true,
      tenant,
    })
  } catch (error) {
    console.error("[v0] Error switching tenant:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
