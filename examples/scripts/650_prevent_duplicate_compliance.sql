-- =====================================================
-- МИГРАЦИЯ 650: ЗАЩИТА ОТ ДУБЛЕЙ COMPLIANCE RECORDS
-- =====================================================
-- Предотвращение создания дублей записей соответствия
-- Stage: 17
-- Дата: 13 октября 2025

-- =====================================================
-- 1. PARTIAL UNIQUE INDEX
-- =====================================================

-- Разрешить только ОДНУ активную запись на пару requirement + organization
-- Используем реальные статусы из compliance_status enum
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_compliance_per_org
  ON compliance_records (requirement_id, organization_id)
  WHERE status NOT IN ('non_compliant', 'not_applicable');

COMMENT ON INDEX unique_active_compliance_per_org IS 
  'Защита от дублей: только одна активная запись соответствия на requirement + organization';

-- =====================================================
-- 2. ФУНКЦИЯ: ПРОВЕРКА ДУБЛЕЙ
-- =====================================================

CREATE OR REPLACE FUNCTION check_duplicate_compliance(
  p_requirement_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  id UUID,
  status VARCHAR,
  created_at TIMESTAMPTZ,
  measures_count BIGINT,
  evidence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.status,
    cr.created_at,
    (SELECT COUNT(*) FROM control_measures WHERE compliance_record_id = cr.id) as measures_count,
    (SELECT COUNT(*) FROM evidence WHERE compliance_record_id = cr.id) as evidence_count
  FROM compliance_records cr
  WHERE cr.requirement_id = p_requirement_id
    AND cr.organization_id = p_organization_id
  ORDER BY cr.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_duplicate_compliance IS 
  'Проверить существующие записи соответствия для requirement + organization';

-- =====================================================
-- 3. ПРОВЕРКА
-- =====================================================

SELECT 'Duplicate prevention ready!' as status;

-- Проверить есть ли дубли сейчас
SELECT 
  requirement_id,
  organization_id,
  COUNT(*) as duplicates
FROM compliance_records
WHERE status NOT IN ('non_compliant', 'not_applicable')
GROUP BY requirement_id, organization_id
HAVING COUNT(*) > 1;

