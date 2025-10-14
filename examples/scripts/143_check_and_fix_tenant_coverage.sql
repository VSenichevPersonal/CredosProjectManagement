-- Проверка и исправление покрытия tenant_id во всех таблицах
-- Этот скрипт проверяет, какие данные не привязаны к тенанту и привязывает их

-- ============================================================================
-- ЧАСТЬ 1: Проверка текущего состояния
-- ============================================================================

-- 1. Проверка compliance_records
SELECT 
  'compliance_records' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_id,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM compliance_records;

-- 2. Проверка evidence
SELECT 
  'evidence' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_id,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM evidence;

-- 3. Проверка controls
SELECT 
  'controls' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_id,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM controls;

-- 4. Проверка control_mappings
SELECT 
  'control_mappings' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_id,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM control_mappings;

-- 5. Проверка organization_controls
SELECT 
  'organization_controls' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_id,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM organization_controls;

-- 6. Проверка control_evidence
SELECT 
  'control_evidence' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_id,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM control_evidence;

-- 7. Проверка control_tests
SELECT 
  'control_tests' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_id,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant_id
FROM control_tests;

-- ============================================================================
-- ЧАСТЬ 2: Добавление tenant_id в таблицы рисков (если еще нет)
-- ============================================================================

-- Добавить tenant_id в risks
ALTER TABLE risks 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Добавить tenant_id в risk_assessments
ALTER TABLE risk_assessments 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Добавить tenant_id в risk_mitigations
ALTER TABLE risk_mitigations 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Создать индексы
CREATE INDEX IF NOT EXISTS idx_risks_tenant_id ON risks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_tenant_id ON risk_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_risk_mitigations_tenant_id ON risk_mitigations(tenant_id);

-- ============================================================================
-- ЧАСТЬ 3: Привязка данных к тенанту "Правительство Тульской области"
-- ============================================================================

-- Получить ID тенанта Тульской области
DO $$
DECLARE
  tula_tenant_id UUID;
BEGIN
  SELECT id INTO tula_tenant_id FROM tenants WHERE slug = 'tula-region';
  
  -- Привязать compliance_records через organization
  UPDATE compliance_records cr
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND organization_id IN (
    SELECT id FROM organizations WHERE tenant_id = tula_tenant_id
  );
  
  -- Привязать evidence через organization
  UPDATE evidence e
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND organization_id IN (
    SELECT id FROM organizations WHERE tenant_id = tula_tenant_id
  );
  
  -- Привязать controls (все существующие контроли к Тульской области)
  UPDATE controls
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL;
  
  -- Привязать control_mappings через requirement
  UPDATE control_mappings cm
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND requirement_id IN (
    SELECT id FROM requirements WHERE tenant_id = tula_tenant_id
  );
  
  -- Привязать organization_controls через organization
  UPDATE organization_controls oc
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND organization_id IN (
    SELECT id FROM organizations WHERE tenant_id = tula_tenant_id
  );
  
  -- Привязать control_evidence через organization
  UPDATE control_evidence ce
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND organization_id IN (
    SELECT id FROM organizations WHERE tenant_id = tula_tenant_id
  );
  
  -- Привязать control_tests через organization
  UPDATE control_tests ct
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND organization_id IN (
    SELECT id FROM organizations WHERE tenant_id = tula_tenant_id
  );
  
  -- Привязать risks через organization
  UPDATE risks r
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND organization_id IN (
    SELECT id FROM organizations WHERE tenant_id = tula_tenant_id
  );
  
  -- Привязать risk_assessments через risk
  UPDATE risk_assessments ra
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND risk_id IN (
    SELECT id FROM risks WHERE tenant_id = tula_tenant_id
  );
  
  -- Привязать risk_mitigations через risk
  UPDATE risk_mitigations rm
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL
  AND risk_id IN (
    SELECT id FROM risks WHERE tenant_id = tula_tenant_id
  );
  
  RAISE NOTICE 'Все данные привязаны к тенанту Тульской области';
END $$;

-- ============================================================================
-- ЧАСТЬ 4: Итоговая проверка распределения по тенантам
-- ============================================================================

SELECT 
  t.name as tenant_name,
  (SELECT COUNT(*) FROM compliance_records WHERE tenant_id = t.id) as compliance_records,
  (SELECT COUNT(*) FROM evidence WHERE tenant_id = t.id) as evidence,
  (SELECT COUNT(*) FROM controls WHERE tenant_id = t.id) as controls,
  (SELECT COUNT(*) FROM control_mappings WHERE tenant_id = t.id) as control_mappings,
  (SELECT COUNT(*) FROM organization_controls WHERE tenant_id = t.id) as organization_controls,
  (SELECT COUNT(*) FROM control_evidence WHERE tenant_id = t.id) as control_evidence,
  (SELECT COUNT(*) FROM control_tests WHERE tenant_id = t.id) as control_tests,
  (SELECT COUNT(*) FROM risks WHERE tenant_id = t.id) as risks,
  (SELECT COUNT(*) FROM risk_assessments WHERE tenant_id = t.id) as risk_assessments,
  (SELECT COUNT(*) FROM risk_mitigations WHERE tenant_id = t.id) as risk_mitigations
FROM tenants t
ORDER BY t.name;
