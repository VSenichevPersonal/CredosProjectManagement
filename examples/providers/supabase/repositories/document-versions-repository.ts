/**
 * Document Versions Repository  
 * Временная заглушка - таблицы document_versions пока нет
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export class DocumentVersionsRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId?: string
  ) {}

  async create(versionData: any) {
    // TODO: Когда будет таблица document_versions
    // Пока просто возвращаем success
    console.log('[DocumentVersions] Skipping version creation (table not exists yet)')
    return { id: 'temp-version-id' }
  }
}

