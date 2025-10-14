/**
 * @intent: API for updating specific AI setting
 * @llm-note: PATCH /api/admin/ai-settings/[id] - update setting
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = params

    // Update setting
    const { data, error } = await supabase
      .from('ai_settings')
      .update({
        provider: body.provider,
        model_name: body.modelName,
        temperature: body.temperature,
        max_tokens: body.maxTokens,
        is_enabled: body.isEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[AI Settings] Update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[AI Settings] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

