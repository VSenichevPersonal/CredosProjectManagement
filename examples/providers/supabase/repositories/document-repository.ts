/**
 * Document Repository
 * Документы - это evidence с is_document = true
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export class DocumentRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId?: string
  ) {}

  async findMany(filters?: any) {
    let query = this.supabase
      .from('evidence')
      .select('*')
      .eq('is_document', true)
    
    if (this.tenantId) {
      query = query.eq('tenant_id', this.tenantId)
    }
    
    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('evidence')
      .select('*')
      .eq('id', id)
      .eq('is_document', true)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    
    return data
  }

  async create(documentData: any) {
    const { data, error } = await this.supabase
      .from('evidence')
      .insert({
        ...documentData,
        tenant_id: this.tenantId,
        is_document: true
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async update(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('evidence')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('evidence')
      .delete()
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
    
    if (error) throw error
  }

  async findExpiring(withinDays: number) {
    // TODO: Реализовать когда будет поле expires_at
    return []
  }
}

