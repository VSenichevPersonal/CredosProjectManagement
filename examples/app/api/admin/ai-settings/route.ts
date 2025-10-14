/**
 * API для управления AI Settings
 */

import { NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { createClient } from "@/lib/supabase/server"
import { Permission } from "@/lib/access-control/permissions"

/**
 * GET - получить настройки для document_generation
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)
    
    // Проверка прав (только админы)
    await ctx.access.require(Permission.ADMIN)
    
    // Получаем настройки для document_generation
    const { data, error } = await ctx.db.supabase
      .from('ai_settings')
      .select('*')
      .eq('task_type', 'document_generation')
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle()
    
    if (error) throw error
    
    // Если нет - возвращаем дефолтные
    if (!data) {
      return NextResponse.json({
        data: {
          task_type: 'document_generation',
          provider: 'openai',
          model_name: 'gpt-4o',
          temperature: 0.3,
          max_tokens: 4096,
          max_clarification_rounds: 3,
          is_enabled: true
        }
      })
    }
    
    return NextResponse.json({ data })
    
  } catch (error: any) {
    console.error('[AI Settings API] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH - обновить настройки
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)
    
    await ctx.access.require(Permission.ADMIN)
    
    const body = await request.json()
    const { maxClarificationRounds } = body
    
    // Проверяем диапазон
    if (maxClarificationRounds < 1 || maxClarificationRounds > 10) {
      return NextResponse.json(
        { error: "maxClarificationRounds должно быть от 1 до 10" },
        { status: 400 }
      )
    }
    
    // Обновляем или создаём настройку
    const { data: existing } = await ctx.db.supabase
      .from('ai_settings')
      .select('id')
      .eq('task_type', 'document_generation')
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle()
    
    if (existing) {
      // Обновляем
      const { data, error } = await ctx.db.supabase
        .from('ai_settings')
        .update({
          max_clarification_rounds: maxClarificationRounds,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({ data })
    } else {
      // Создаём
      const { data, error } = await ctx.db.supabase
        .from('ai_settings')
        .insert({
          tenant_id: ctx.tenantId,
          task_type: 'document_generation',
          provider: 'openai',
          model_name: 'gpt-4o',
          temperature: 0.3,
          max_tokens: 4096,
          max_clarification_rounds: maxClarificationRounds,
          is_enabled: true,
          is_default: true,
          created_by: ctx.user?.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({ data }, { status: 201 })
    }
    
  } catch (error: any) {
    console.error('[AI Settings API] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
