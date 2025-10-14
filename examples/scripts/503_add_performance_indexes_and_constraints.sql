-- =====================================================
-- Индексы производительности и ограничения уникальности
-- =====================================================
-- Версия: 1.3 (Simplified - only core tables)
-- Дата: 2025-01-10
-- Описание: Добавляет индексы для оптимизации запросов
--           только для гарантированно существующих таблиц

-- =====================================================
-- ЧАСТЬ 1: ОГРАНИЧЕНИЯ УНИКАЛЬНОСТИ
-- =====================================================

-- 1.1 Уникальность записи соответствия (одно требование = одна организация)
DROP INDEX IF EXISTS idx_compliance_records_unique;
CREATE UNIQUE INDEX idx_compliance_records_unique
  ON compliance_records(requirement_id, organization_id, tenant_id);

COMMENT ON INDEX idx_compliance_records_unique IS 
  'Ensures one compliance record per requirement per organization per tenant';

-- =====================================================
-- ЧАСТЬ 2: ИНДЕКСЫ ДЛЯ COMPLIANCE_RECORDS
-- =====================================================

-- 2.1 Быстрый поиск по требованию и организации
DROP INDEX IF EXISTS idx_compliance_records_requirement_org;
CREATE INDEX idx_compliance_records_requirement_org 
  ON compliance_records(requirement_id, organization_id);

-- 2.2 Фильтрация по статусу
DROP INDEX IF EXISTS idx_compliance_records_status_tenant;
CREATE INDEX idx_compliance_records_status_tenant 
  ON compliance_records(status, tenant_id);

-- 2.3 Сортировка по дате обновления
DROP INDEX IF EXISTS idx_compliance_records_updated_tenant;
CREATE INDEX idx_compliance_records_updated_tenant 
  ON compliance_records(updated_at DESC, tenant_id);

-- =====================================================
-- ЧАСТЬ 3: ИНДЕКСЫ ДЛЯ EVIDENCE
-- =====================================================

-- 3.1 Поиск по записи соответствия
DROP INDEX IF EXISTS idx_evidence_compliance_record;
CREATE INDEX idx_evidence_compliance_record 
  ON evidence(compliance_record_id);

-- 3.2 Поиск по требованию
DROP INDEX IF EXISTS idx_evidence_requirement_tenant;
CREATE INDEX idx_evidence_requirement_tenant 
  ON evidence(requirement_id, tenant_id);

-- 3.3 Фильтрация по статусу
DROP INDEX IF EXISTS idx_evidence_status_tenant;
CREATE INDEX idx_evidence_status_tenant 
  ON evidence(status, tenant_id);

-- 3.4 Поиск по загрузившему пользователю
DROP INDEX IF EXISTS idx_evidence_uploaded_by;
CREATE INDEX idx_evidence_uploaded_by 
  ON evidence(uploaded_by, tenant_id);

-- 3.5 Сортировка по дате загрузки
DROP INDEX IF EXISTS idx_evidence_uploaded_at;
CREATE INDEX idx_evidence_uploaded_at 
  ON evidence(uploaded_at DESC, tenant_id);

-- =====================================================
-- ЧАСТЬ 4: ИНДЕКСЫ ДЛЯ REQUIREMENTS
-- =====================================================

-- 4.1 Поиск по нормативной базе
DROP INDEX IF EXISTS idx_requirements_framework_tenant;
CREATE INDEX idx_requirements_framework_tenant 
  ON requirements(regulatory_framework_id, tenant_id);

-- 4.2 Уникальность кода требования в рамках тенанта
DROP INDEX IF EXISTS idx_requirements_code_tenant_unique;
CREATE UNIQUE INDEX idx_requirements_code_tenant_unique 
  ON requirements(code, tenant_id);

-- 4.3 Фильтрация по статусу
DROP INDEX IF EXISTS idx_requirements_status_tenant;
CREATE INDEX idx_requirements_status_tenant 
  ON requirements(status, tenant_id);

-- 4.4 Поиск по документу
DROP INDEX IF EXISTS idx_requirements_document_tenant;
CREATE INDEX idx_requirements_document_tenant 
  ON requirements(document_id, tenant_id);

-- =====================================================
-- ЧАСТЬ 5: ИНДЕКСЫ ДЛЯ ORGANIZATIONS
-- =====================================================

-- 5.1 Поиск по родительской организации
DROP INDEX IF EXISTS idx_organizations_parent_tenant;
CREATE INDEX idx_organizations_parent_tenant 
  ON organizations(parent_id, tenant_id);

-- 5.2 Фильтрация по типу организации
DROP INDEX IF EXISTS idx_organizations_type_tenant;
CREATE INDEX idx_organizations_type_tenant 
  ON organizations(type, tenant_id);

-- 5.3 Поиск активных организаций
DROP INDEX IF EXISTS idx_organizations_active;
CREATE INDEX idx_organizations_active 
  ON organizations(is_active, tenant_id);

-- =====================================================
-- ЧАСТЬ 6: АНАЛИЗ ТАБЛИЦ
-- =====================================================

-- Обновить статистику для оптимизатора запросов
ANALYZE compliance_records;
ANALYZE evidence;
ANALYZE requirements;
ANALYZE organizations;

-- =====================================================
-- ЧАСТЬ 7: ОТЧЁТ О СОЗДАННЫХ ИНДЕКСАХ
-- =====================================================

DO $$
DECLARE
  v_index_count INT;
  v_unique_count INT;
BEGIN
  -- Подсчитать созданные индексы
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN (
      'compliance_records', 'evidence', 'requirements', 'organizations'
    );
  
  SELECT COUNT(*) INTO v_unique_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND indexdef LIKE '%UNIQUE%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Performance Indexes Report';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total indexes created: %', v_index_count;
  RAISE NOTICE 'Unique constraints: %', v_unique_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Key improvements:';
  RAISE NOTICE '  - Prevents duplicate compliance records';
  RAISE NOTICE '  - Prevents duplicate requirement codes per tenant';
  RAISE NOTICE '  - Optimizes queries by status, organization, type';
  RAISE NOTICE '  - Speeds up tenant-based filtering';
  RAISE NOTICE '  - Improves sorting by dates';
  RAISE NOTICE '========================================';
END $$;
