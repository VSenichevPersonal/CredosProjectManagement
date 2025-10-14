/**
 * @intent: API for user notification settings
 * @llm-note: GET/POST /api/settings/notifications
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's notification settings
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Notification Settings] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no user settings, get tenant defaults
    if (!data) {
      const { data: tenantSettings } = await supabase
        .from('notification_settings')
        .select('*')
        .is('user_id', null)
        .single()

      return NextResponse.json({ 
        data: tenantSettings || {
          toast_duration_ms: 3000,
          toast_position: 'top-right',
          max_toasts_visible: 3,
          show_success: true,
          show_info: true,
          show_warning: true,
          show_error: true
        }
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[Notification Settings] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Upsert user settings
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        toast_duration_ms: body.toastDurationMs,
        toast_position: body.toastPosition,
        max_toasts_visible: body.maxToastsVisible,
        show_success: body.showSuccess,
        show_info: body.showInfo,
        show_warning: body.showWarning,
        show_error: body.showError,
        play_sound: body.playSound,
        email_notifications: body.emailNotifications,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Notification Settings] Save error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[Notification Settings] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

