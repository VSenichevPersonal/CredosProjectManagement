/**
 * @intent: Service for managing organization-level master controls
 * @llm-note: Orchestrates control reuse between requirements
 * @architecture: Enterprise feature - cross-requirement control sharing
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import { AppError } from "@/lib/errors"

export class MasterControlService {
  /**
   * Найти или создать master control для организации + template
   */
  static async findOrCreate(
    ctx: ExecutionContext,
    organizationId: string,
    templateId: string
  ): Promise<string> {
    ctx.logger.info("[MasterControlService] findOrCreate", { organizationId, templateId })

    // 1. Поиск существующего
    const { data: existing } = await ctx.db.supabase
      .from('organization_controls')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('template_id', templateId)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (existing) {
      ctx.logger.info("[MasterControlService] Found existing master", { masterId: existing.id })
      return existing.id
    }

    // 2. Создание нового
    const { data: created, error } = await ctx.db.supabase
      .from('organization_controls')
      .insert({
        tenant_id: ctx.tenantId,
        organization_id: organizationId,
        template_id: templateId,
        implementation_status: 'not_implemented',
        evidence_ids: [],
        created_by: ctx.user!.id
      })
      .select('id')
      .single()

    if (error || !created) {
      throw new AppError(`Failed to create master control: ${error?.message}`, 500)
    }

    ctx.logger.info("[MasterControlService] Created new master", { masterId: created.id })
    return created.id
  }

  /**
   * Получить все меры связанные с master control
   */
  static async getLinkedMeasures(
    ctx: ExecutionContext,
    masterControlId: string
  ) {
    const { data, error } = await ctx.db.supabase
      .from('control_measures')
      .select(`
        id,
        title,
        status,
        compliance_record_id,
        requirement_id,
        requirements!inner(code, title)
      `)
      .eq('master_control_id', masterControlId)
      .eq('tenant_id', ctx.tenantId)

    if (error) {
      throw new AppError(`Failed to get linked measures: ${error.message}`, 500)
    }

    return data || []
  }

  /**
   * Синхронизировать статус от master ко всем мерам
   */
  static async syncStatus(
    ctx: ExecutionContext,
    masterControlId: string,
    newStatus: string,
    implementationDate?: Date
  ) {
    ctx.logger.info("[MasterControlService] syncStatus", { masterControlId, newStatus })

    // 1. Обновить master
    await ctx.db.supabase
      .from('organization_controls')
      .update({
        implementation_status: newStatus,
        implementation_date: implementationDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', masterControlId)

    // 2. Обновить все связанные меры (если inherit=true)
    const { error } = await ctx.db.supabase
      .from('control_measures')
      .update({
        status: newStatus,
        actual_implementation_date: implementationDate,
        updated_at: new Date().toISOString()
      })
      .eq('master_control_id', masterControlId)
      .eq('inherit_from_master', true)

    if (error) {
      ctx.logger.error("[MasterControlService] Failed to sync", { error })
      throw new AppError(`Failed to sync status: ${error.message}`, 500)
    }

    ctx.logger.info("[MasterControlService] Status synced successfully")
  }

  /**
   * Получить статистику по master control
   */
  static async getStats(
    ctx: ExecutionContext,
    masterControlId: string
  ) {
    const { data, error } = await ctx.db.supabase
      .from('organization_controls')
      .select(`
        id,
        implementation_status,
        evidence_ids,
        control_measures!inner(id, requirement_id)
      `)
      .eq('id', masterControlId)
      .single()

    if (error || !data) {
      return {
        evidenceCount: 0,
        linkedRequirementsCount: 0,
        linkedMeasuresCount: 0
      }
    }

    return {
      evidenceCount: (data.evidence_ids || []).length,
      linkedRequirementsCount: new Set(
        (data.control_measures || []).map((m: any) => m.requirement_id)
      ).size,
      linkedMeasuresCount: (data.control_measures || []).length
    }
  }
}

