/**
 * @intent: Check for duplicate compliance records
 * @llm-note: GET /api/compliance/check-duplicate?requirementId=...&organizationId=...
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

    const searchParams = request.nextUrl.searchParams
    const requirementId = searchParams.get('requirementId')
    const organizationId = searchParams.get('organizationId')

    if (!requirementId || !organizationId) {
      return NextResponse.json({ 
        error: "requirementId and organizationId are required" 
      }, { status: 400 })
    }

    // Поиск существующих записей
    const { data: existing, error } = await supabase
      .from('compliance_records')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        requirements(code, title)
      `)
      .eq('requirement_id', requirementId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Check Duplicate] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Проверить есть ли активные
    const hasActive = existing && existing.some(r => 
      !['non_compliant', 'not_applicable'].includes(r.status)
    )

    return NextResponse.json({
      exists: (existing && existing.length > 0),
      hasActive,
      records: existing || []
    })
  } catch (error) {
    console.error('[Check Duplicate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

