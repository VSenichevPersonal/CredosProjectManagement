/**
 * @intent: API endpoints for document types
 * @llm-note: GET /api/document-types - list document types
 *            POST /api/document-types - create new type (admin)
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

    // Получить типы документов (глобальные + tenant-specific)
    const { data, error } = await supabase
      .from('document_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      console.error('[Document Types] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('[Document Types] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const body: CreateDocumentTypeDTO = await request.json()
    
    const type = await DocumentTypeService.create(ctx, body)
    
    return NextResponse.json({ data: type }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

