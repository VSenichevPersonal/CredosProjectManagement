-- =====================================================
-- МИГРАЦИЯ 660: ORGANIZATION-LEVEL CONTROLS (MASTER)
-- =====================================================
-- Hybrid подход: меры на уровне организации для переиспользования
-- Stage: 17
-- Дата: 13 октября 2025

-- =====================================================
-- 1. РАСШИРЕНИЕ control_measures
-- =====================================================

-- Добавляем ссылку на master control
ALTER TABLE control_measures ADD COLUMN IF NOT EXISTS
  master_control_id UUID REFERENCES organization_controls(id) ON DELETE SET NULL;

-- Флаг: наследуется ли от master
ALTER TABLE control_measures ADD COLUMN IF NOT EXISTS
  inherit_from_master BOOLEAN DEFAULT true;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_control_measures_master 
  ON control_measures(master_control_id) 
  WHERE master_control_id IS NOT NULL;

COMMENT ON COLUMN control_measures.master_control_id IS 
  'Ссылка на организационный контроль (master). Наследует статус и доказательства.';

COMMENT ON COLUMN control_measures.inherit_from_master IS 
  'Наследовать ли статус и доказательства от master контроля';

-- =====================================================
-- 2. РАСШИРЕНИЕ organization_controls
-- =====================================================

-- Добавляем поля для совместимости с новой архитектурой
ALTER TABLE organization_controls ADD COLUMN IF NOT EXISTS
  template_id UUID;  -- Из какого control_template создан

ALTER TABLE organization_controls ADD COLUMN IF NOT EXISTS
  evidence_ids UUID[];  -- Массив evidence для быстрого доступа

-- Индексы
CREATE INDEX IF NOT EXISTS idx_org_controls_template 
  ON organization_controls(template_id) 
  WHERE template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_controls_evidence 
  ON organization_controls USING GIN(evidence_ids) 
  WHERE evidence_ids IS NOT NULL;

COMMENT ON COLUMN organization_controls.template_id IS 
  'Control template из которого создан организационный контроль';

COMMENT ON COLUMN organization_controls.evidence_ids IS 
  'Массив ID доказательств привязанных к организационному контролю';

-- =====================================================
-- 3. VIEW: Control Measures с наследованием
-- =====================================================

CREATE OR REPLACE VIEW v_control_measures_enriched AS
SELECT 
  cm.id,
  cm.compliance_record_id,
  cm.requirement_id,
  cm.organization_id,
  cm.template_id,
  cm.master_control_id,
  cm.inherit_from_master,
  cm.title,
  cm.description,
  
  -- Эффективный статус (либо свой, либо от master)
  CASE 
    WHEN cm.inherit_from_master AND cm.master_control_id IS NOT NULL 
    THEN COALESCE(oc.implementation_status, cm.status)
    ELSE cm.status
  END as effective_status,
  
  -- Эффективная дата реализации
  CASE 
    WHEN cm.inherit_from_master AND cm.master_control_id IS NOT NULL 
    THEN COALESCE(oc.implementation_date, cm.actual_implementation_date)
    ELSE cm.actual_implementation_date
  END as effective_implementation_date,
  
  -- Есть ли master
  cm.master_control_id IS NOT NULL as has_master,
  
  -- Данные master control
  oc.implementation_status as master_status,
  oc.implementation_date as master_date,
  oc.evidence_ids as master_evidence_ids,
  
  -- Количество связанных требований через master
  (SELECT COUNT(DISTINCT cm2.requirement_id)
   FROM control_measures cm2
   WHERE cm2.master_control_id = cm.master_control_id
  ) as shared_requirements_count,
  
  cm.created_at,
  cm.updated_at
FROM control_measures cm
LEFT JOIN organization_controls oc ON oc.id = cm.master_control_id;

COMMENT ON VIEW v_control_measures_enriched IS 
  'Control measures с автоматическим наследованием статусов от organization_controls';

-- =====================================================
-- 4. ФУНКЦИЯ: Найти или создать master control
-- =====================================================

CREATE OR REPLACE FUNCTION find_or_create_master_control(
  p_organization_id UUID,
  p_template_id UUID,
  p_tenant_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_master_id UUID;
  v_template RECORD;
BEGIN
  -- 1. Попытка найти существующий master control
  SELECT id INTO v_master_id
  FROM organization_controls
  WHERE organization_id = p_organization_id
    AND template_id = p_template_id
    AND tenant_id = p_tenant_id
  LIMIT 1;
  
  IF v_master_id IS NOT NULL THEN
    RAISE NOTICE 'Found existing master control: %', v_master_id;
    RETURN v_master_id;
  END IF;
  
  -- 2. Получить данные template
  SELECT * INTO v_template
  FROM control_templates
  WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Control template % not found', p_template_id;
  END IF;
  
  -- 3. Создать новый master control
  INSERT INTO organization_controls (
    tenant_id,
    organization_id,
    control_id,  -- NULL или создаем control
    template_id,
    implementation_status,
    evidence_ids,
    created_at
  ) VALUES (
    p_tenant_id,
    p_organization_id,
    NULL,  -- Пока без control_id
    p_template_id,
    'not_implemented',
    ARRAY[]::UUID[],
    NOW()
  )
  RETURNING id INTO v_master_id;
  
  RAISE NOTICE 'Created new master control: %', v_master_id;
  
  RETURN v_master_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_or_create_master_control IS 
  'Найти существующий или создать новый master control для организации + template';

-- =====================================================
-- 5. ТРИГГЕР: Синхронизация evidence_ids в master
-- =====================================================

CREATE OR REPLACE FUNCTION sync_master_evidence_ids()
RETURNS TRIGGER AS $$
DECLARE
  v_master_id UUID;
  v_evidence_id UUID;
BEGIN
  -- Работаем только с evidence_links для control_measures
  IF TG_TABLE_NAME = 'evidence_links' AND NEW.control_measure_id IS NOT NULL THEN
    
    -- Получить master_control_id из меры
    SELECT master_control_id INTO v_master_id
    FROM control_measures
    WHERE id = NEW.control_measure_id;
    
    IF v_master_id IS NOT NULL THEN
      -- Добавить evidence_id в массив master control
      UPDATE organization_controls
      SET evidence_ids = array_append(evidence_ids, NEW.evidence_id)
      WHERE id = v_master_id
        AND NOT (NEW.evidence_id = ANY(evidence_ids));  -- Избегаем дублей
      
      RAISE NOTICE 'Added evidence % to master control %', NEW.evidence_id, v_master_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_master_evidence ON evidence_links;
CREATE TRIGGER trigger_sync_master_evidence
  AFTER INSERT ON evidence_links
  FOR EACH ROW
  EXECUTE FUNCTION sync_master_evidence_ids();

-- =====================================================
-- 6. ФУНКЦИЯ: Получить все evidence для меры (включая master)
-- =====================================================

CREATE OR REPLACE FUNCTION get_measure_evidence_with_master(
  p_measure_id UUID
)
RETURNS TABLE (
  evidence_id UUID,
  source VARCHAR  -- 'direct' или 'master'
) AS $$
DECLARE
  v_master_id UUID;
BEGIN
  -- Получить master_control_id
  SELECT master_control_id INTO v_master_id
  FROM control_measures
  WHERE id = p_measure_id;
  
  -- 1. Прямые evidence links
  RETURN QUERY
  SELECT 
    el.evidence_id,
    'direct'::VARCHAR as source
  FROM evidence_links el
  WHERE el.control_measure_id = p_measure_id;
  
  -- 2. Evidence из master (если есть и inherit=true)
  IF v_master_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      unnest(oc.evidence_ids) as evidence_id,
      'master'::VARCHAR as source
    FROM organization_controls oc
    JOIN control_measures cm ON cm.master_control_id = oc.id
    WHERE cm.id = p_measure_id
      AND cm.inherit_from_master = true;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 7. ПРОВЕРКА
-- =====================================================

SELECT 'Organization-level controls ready!' as status;

SELECT 
  COUNT(*) as existing_org_controls
FROM organization_controls;

SELECT 
  COUNT(*) as measures_with_master
FROM control_measures
WHERE master_control_id IS NOT NULL;

