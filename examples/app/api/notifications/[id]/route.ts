import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// PATCH /api/notifications/[id] - Update notification (mark as read)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: body.is_read })
      .eq("id", params.id)
      .eq("user_id", user.id)

    if (error) {
      console.error("[v0] Failed to update notification:", error)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
