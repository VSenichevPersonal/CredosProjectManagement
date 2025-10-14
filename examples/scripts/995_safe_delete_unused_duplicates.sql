-- =====================================================
-- SAFE DELETE UNUSED DUPLICATE REQUIREMENTS
-- =====================================================
-- Удаляет только дубликаты требований, у которых НЕТ:
-- - compliance_records (записей соответствия)
-- - control_measures (мер)
-- - evidence (доказательств)
-- - requirement_organization_mappings (назначений)
--
-- Версия: 1.0
-- Дата: 2025-01-11

-- =====================================================
-- ШАГ 1: ДИАГНОСТИКА - Показать дубликаты и их использование
-- =====================================================

SELECT 
  '=== ДУБЛИКАТЫ ТРЕБОВАНИЙ ===' AS section;

-- Найти дубликаты по названию
WITH duplicates AS (
  SELECT 
    title,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY created_at) as requirement_ids,
    ARRAY_AGG(tenant_id::text ORDER BY created_at) as tenant_ids
  FROM requirements
  WHERE tenant_id = '11111111-1111-1111-1111-111111111111' -- Тула
  GROUP BY title
  HAVING COUNT(*) > 1
)
SELECT 
  d.title,
  d.count as duplicate_count,
  r.id as requirement_id,
  r.tenant_id,
  r.created_at,
  -- Проверка использования
  (SELECT COUNT(*) FROM compliance_records cr WHERE cr.requirement_id = r.id) as compliance_records_count,
  (SELECT COUNT(*) FROM control_measures cm WHERE cm.requirement_id = r.id) as control_measures_count,
  (SELECT COUNT(*) FROM evidence e WHERE e.requirement_id = r.id) as evidence_count,
  (SELECT COUNT(*) FROM requirement_organization_mappings rom WHERE rom.requirement_id = r.id) as org_mappings_count,
  -- Безопасно ли удалять?
  CASE 
    WHEN (
      (SELECT COUNT(*) FROM compliance_records cr WHERE cr.requirement_id = r.id) = 0
      AND (SELECT COUNT(*) FROM control_measures cm WHERE cm.requirement_id = r.id) = 0
      AND (SELECT COUNT(*) FROM evidence e WHERE e.requirement_id = r.id) = 0
      AND (SELECT COUNT(*) FROM requirement_organization_mappings rom WHERE rom.requirement_id = r.id) = 0
    ) THEN '✅ БЕЗОПАСНО УДАЛИТЬ'
    ELSE '❌ ИСПОЛЬЗУЕТСЯ - НЕ УДАЛЯТЬ'
  END as can_delete
FROM duplicates d
JOIN requirements r ON r.title = d.title AND r.tenant_id = '11111111-1111-1111-1111-111111111111'
ORDER BY d.title, r.created_at;

-- =====================================================
-- ШАГ 2: ПОДСЧЕТ - Сколько будет удалено
-- =====================================================

SELECT 
  '=== СТАТИСТИКА УДАЛЕНИЯ ===' AS section;

WITH duplicates AS (
  SELECT 
    title,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY created_at) as requirement_ids
  FROM requirements
  WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  GROUP BY title
  HAVING COUNT(*) > 1
),
unused_duplicates AS (
  SELECT r.id
  FROM duplicates d
  JOIN requirements r ON r.title = d.title AND r.tenant_id = '11111111-1111-1111-1111-111111111111'
  WHERE NOT EXISTS (SELECT 1 FROM compliance_records cr WHERE cr.requirement_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM control_measures cm WHERE cm.requirement_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM evidence e WHERE e.requirement_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM requirement_organization_mappings rom WHERE rom.requirement_id = r.id)
    -- Оставляем самый старый (первый созданный)
    AND r.id != d.requirement_ids[1]
)
SELECT 
  (SELECT COUNT(*) FROM requirements WHERE tenant_id = '11111111-1111-1111-1111-111111111111') as total_requirements_before,
  (SELECT COUNT(*) FROM unused_duplicates) as will_be_deleted,
  (SELECT COUNT(*) FROM requirements WHERE tenant_id = '11111111-1111-1111-1111-111111111111') - (SELECT COUNT(*) FROM unused_duplicates) as will_remain;

-- =====================================================
-- ШАГ 3: УДАЛЕНИЕ - Удалить неиспользуемые дубликаты
-- =====================================================

SELECT 
  '=== НАЧАЛО УДАЛЕНИЯ ===' AS section;

-- Удаляем только неиспользуемые дубликаты
WITH duplicates AS (
  SELECT 
    title,
    ARRAY_AGG(id ORDER BY created_at) as requirement_ids
  FROM requirements
  WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  GROUP BY title
  HAVING COUNT(*) > 1
),
to_delete AS (
  SELECT r.id, r.title
  FROM duplicates d
  JOIN requirements r ON r.title = d.title AND r.tenant_id = '11111111-1111-1111-1111-111111111111'
  WHERE NOT EXISTS (SELECT 1 FROM compliance_records cr WHERE cr.requirement_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM control_measures cm WHERE cm.requirement_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM evidence e WHERE e.requirement_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM requirement_organization_mappings rom WHERE rom.requirement_id = r.id)
    -- Оставляем самый старый (первый созданный)
    AND r.id != d.requirement_ids[1]
)
DELETE FROM requirements
WHERE id IN (SELECT id FROM to_delete)
RETURNING id, title, created_at;

-- =====================================================
-- ШАГ 4: ПРОВЕРКА - Финальная статистика
-- =====================================================

SELECT 
  '=== РЕЗУЛЬТАТ ===' AS section;

SELECT 
  t.name as tenant_name,
  t.slug,
  COUNT(r.id) as requirements_count
FROM tenants t
LEFT JOIN requirements r ON r.tenant_id = t.id
GROUP BY t.id, t.name, t.slug
ORDER BY t.name;

-- Проверка: остались ли дубликаты?
SELECT 
  '=== ПРОВЕРКА ДУБЛИКАТОВ ===' AS section;

SELECT 
  title,
  COUNT(*) as count
FROM requirements
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
GROUP BY title
HAVING COUNT(*) > 1;

SELECT 'Cleanup completed successfully!' AS status;
