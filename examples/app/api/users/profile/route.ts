import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, position } = body

    const { error } = await supabase
      .from("users")
      .update({
        name,
        phone,
        position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
