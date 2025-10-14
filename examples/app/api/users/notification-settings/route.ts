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

    const settings = await request.json()

    const { error } = await supabase
      .from("users")
      .update({
        notification_settings: settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[NOTIFICATION_SETTINGS_UPDATE_ERROR]", error)
    return NextResponse.json({ error: "Failed to update notification settings" }, { status: 500 })
  }
}
