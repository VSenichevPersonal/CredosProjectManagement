-- =====================================================
-- МИГРАЦИЯ 673: ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================
-- Stage: 17
-- Дата: 13 октября 2025
-- 
-- ПРОБЛЕМА:
-- Таблицы требований и записей соответствия грузятся медленно (1-2 сек)
-- Нет индексов на часто используемые комбинации полей
--
-- РЕШЕНИЕ:
-- Добавить составные индексы для типичных запросов

-- =====================================================
-- 1. ИНДЕКСЫ ДЛЯ compliance_records
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_compliance_tenant_created 
ON compliance_records(tenant_id, created_at DESC)
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_tenant_status 
ON compliance_records(tenant_id, status)
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_tenant_org 
ON compliance_records(tenant_id, organization_id)
WHERE tenant_id IS NOT NULL AND organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_tenant_req 
ON compliance_records(tenant_id, requirement_id)
WHERE tenant_id IS NOT NULL AND requirement_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_updated 
ON compliance_records(tenant_id, updated_at DESC)
WHERE tenant_id IS NOT NULL;

-- =====================================================
-- 2. ИНДЕКСЫ ДЛЯ requirements
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_requirements_tenant_code 
ON requirements(tenant_id, code)
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requirements_id_tenant 
ON requirements(id, tenant_id)
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requirements_text_search 
ON requirements USING gin(
  to_tsvector('russian', 
    COALESCE(code, '') || ' ' || 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '')
  )
)
WHERE tenant_id IS NOT NULL;

-- =====================================================
-- 3. ИНДЕКСЫ ДЛЯ organizations
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_organizations_tenant_name 
ON organizations(tenant_id, name)
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_id_tenant 
ON organizations(id, tenant_id)
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_text_search 
ON organizations USING gin(
  to_tsvector('russian', 
    COALESCE(name, '') || ' ' || 
    COALESCE(inn, '')
  )
)
WHERE tenant_id IS NOT NULL;

-- =====================================================
-- 4. ИНДЕКСЫ ДЛЯ control_measures
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_control_measures_compliance 
ON control_measures(compliance_record_id, status)
WHERE compliance_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_control_measures_tenant_compliance 
ON control_measures(tenant_id, compliance_record_id)
WHERE tenant_id IS NOT NULL AND compliance_record_id IS NOT NULL;

-- =====================================================
-- 5. ИНДЕКСЫ ДЛЯ evidence_links
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_evidence_links_measure 
ON evidence_links(control_measure_id, evidence_id)
WHERE control_measure_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_links_tenant 
ON evidence_links(tenant_id, control_measure_id)
WHERE tenant_id IS NOT NULL;

-- =====================================================
-- 6. АНАЛИЗ СТАТИСТИКИ
-- =====================================================

ANALYZE compliance_records;
ANALYZE requirements;
ANALYZE organizations;
ANALYZE control_measures;
ANALYZE evidence_links;
ANALYZE evidence;

-- =====================================================
-- 7. ПРОВЕРКА РЕЗУЛЬТАТА
-- =====================================================

SELECT 'Performance indexes created!' as status;

-- Проверяем созданные индексы
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename IN ('compliance_records', 'requirements', 'organizations', 'control_measures', 'evidence_links')
    AND indexname LIKE 'idx_%tenant%'
  )
ORDER BY tablename, indexname;

-- Размер индексов
SELECT 
  relname as tablename,
  COUNT(*) as index_count,
  pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('compliance_records', 'requirements', 'organizations')
GROUP BY relname
ORDER BY relname;
