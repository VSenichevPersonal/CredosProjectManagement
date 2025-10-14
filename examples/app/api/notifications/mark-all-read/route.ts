import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      console.error("[v0] Failed to mark all as read:", error)
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Mark all read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
