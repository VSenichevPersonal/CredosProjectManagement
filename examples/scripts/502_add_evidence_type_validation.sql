-- =====================================================
-- Валидация типов доказательств при создании связей
-- =====================================================
-- Версия: 1.0
-- Дата: 2025-01-10
-- Описание: Добавляет проверку, что тип доказательства
--           соответствует рекомендованным типам из шаблона меры

-- =====================================================
-- 1. Функция для проверки типа доказательства
-- =====================================================

CREATE OR REPLACE FUNCTION validate_evidence_type_for_measure()
RETURNS TRIGGER AS $$
DECLARE
  v_evidence_type_id UUID;
  v_allowed_types UUID[];
  v_measure_title TEXT;
  v_evidence_type_name TEXT;
BEGIN
  -- Получить тип доказательства
  SELECT evidence_type_id INTO v_evidence_type_id
  FROM evidence
  WHERE id = NEW.evidence_id;
  
  -- Получить разрешённые типы из шаблона меры
  SELECT 
    cmt.recommended_evidence_type_ids,
    cm.title
  INTO 
    v_allowed_types,
    v_measure_title
  FROM control_measures cm
  LEFT JOIN control_measure_templates cmt ON cm.template_id = cmt.id
  WHERE cm.id = NEW.control_measure_id;
  
  -- Если есть ограничения по типам и тип не подходит - ошибка
  IF v_allowed_types IS NOT NULL 
     AND array_length(v_allowed_types, 1) > 0 
     AND NOT (v_evidence_type_id = ANY(v_allowed_types)) THEN
    
    -- Получить название типа доказательства для более понятной ошибки
    SELECT name INTO v_evidence_type_name
    FROM evidence_types
    WHERE id = v_evidence_type_id;
    
    RAISE EXCEPTION 'Evidence type "%" is not allowed for measure "%". This measure requires specific evidence types from its template.', 
      v_evidence_type_name, v_measure_title
      USING HINT = 'Check the recommended evidence types for this control measure template';
  END IF;
  
  -- Если нет ограничений или тип подходит - разрешаем
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_evidence_type_for_measure() IS 
  'Validates that evidence type matches the recommended types from control measure template';

-- =====================================================
-- 2. Применить триггер к evidence_links
-- =====================================================

DROP TRIGGER IF EXISTS validate_evidence_type_trigger ON evidence_links;
CREATE TRIGGER validate_evidence_type_trigger
  BEFORE INSERT OR UPDATE OF evidence_id, control_measure_id ON evidence_links
  FOR EACH ROW
  EXECUTE FUNCTION validate_evidence_type_for_measure();

COMMENT ON TRIGGER validate_evidence_type_trigger ON evidence_links IS 
  'Prevents linking evidence of wrong type to control measures';

-- =====================================================
-- 3. Добавить индексы для быстрой проверки типов
-- =====================================================

-- Индекс для быстрого поиска типа доказательства
CREATE INDEX IF NOT EXISTS idx_evidence_type_id 
  ON evidence(evidence_type_id, tenant_id);

-- Индекс для быстрого доступа к шаблонам мер
CREATE INDEX IF NOT EXISTS idx_control_measures_template 
  ON control_measures(template_id, tenant_id) 
  WHERE template_id IS NOT NULL;

-- =====================================================
-- 4. Функция для получения разрешённых типов доказательств для меры
-- =====================================================

CREATE OR REPLACE FUNCTION get_allowed_evidence_types_for_measure(p_measure_id UUID)
RETURNS TABLE(
  evidence_type_id UUID,
  evidence_type_name TEXT,
  evidence_type_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    et.id,
    et.name,
    et.description
  FROM control_measures cm
  JOIN control_measure_templates cmt ON cm.template_id = cmt.id
  CROSS JOIN LATERAL unnest(cmt.recommended_evidence_type_ids) AS allowed_type_id
  JOIN evidence_types et ON et.id = allowed_type_id
  WHERE cm.id = p_measure_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_allowed_evidence_types_for_measure(UUID) IS 
  'Returns list of allowed evidence types for a control measure based on its template';

-- =====================================================
-- 5. Проверить существующие данные
-- =====================================================

DO $$
DECLARE
  v_invalid_count INT;
  v_invalid_link RECORD;
BEGIN
  -- Подсчитать количество некорректных связей
  SELECT COUNT(*)
  INTO v_invalid_count
  FROM evidence_links el
  JOIN evidence e ON el.evidence_id = e.id
  JOIN control_measures cm ON el.control_measure_id = cm.id
  JOIN control_measure_templates cmt ON cm.template_id = cmt.id
  WHERE cmt.recommended_evidence_type_ids IS NOT NULL
    AND array_length(cmt.recommended_evidence_type_ids, 1) > 0
    AND NOT (e.evidence_type_id = ANY(cmt.recommended_evidence_type_ids));
  
  IF v_invalid_count > 0 THEN
    RAISE WARNING 'Found % evidence links with incorrect types. These should be reviewed:', v_invalid_count;
    
    -- Показать первые 5 некорректных связей
    FOR v_invalid_link IN 
      SELECT 
        el.id AS link_id,
        cm.title AS measure_title,
        et.name AS evidence_type_name
      FROM evidence_links el
      JOIN evidence e ON el.evidence_id = e.id
      JOIN evidence_types et ON e.evidence_type_id = et.id
      JOIN control_measures cm ON el.control_measure_id = cm.id
      JOIN control_measure_templates cmt ON cm.template_id = cmt.id
      WHERE cmt.recommended_evidence_type_ids IS NOT NULL
        AND array_length(cmt.recommended_evidence_type_ids, 1) > 0
        AND NOT (e.evidence_type_id = ANY(cmt.recommended_evidence_type_ids))
      LIMIT 5
    LOOP
      RAISE WARNING '  - Link %: Evidence type "%" for measure "%"', 
        v_invalid_link.link_id, 
        v_invalid_link.evidence_type_name, 
        v_invalid_link.measure_title;
    END LOOP;
  ELSE
    RAISE NOTICE 'All evidence links have correct types.';
  END IF;
END $$;
