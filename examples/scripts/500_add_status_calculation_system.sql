-- =====================================================
-- Система автоматического расчёта статусов соответствия
-- =====================================================
-- Версия: 1.1
-- Дата: 2025-01-10
-- Описание: Добавляет функции и триггеры для автоматического
--           обновления статусов мер и записей соответствия
--           на основе наличия доказательств

-- =====================================================
-- 1. Функция расчёта completion меры
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_measure_completion(p_measure_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_required_count INT;
  v_provided_count INT;
  v_result JSONB;
BEGIN
  -- Получить количество требуемых типов доказательств из шаблона
  SELECT array_length(cmt.recommended_evidence_type_ids, 1)
  INTO v_required_count
  FROM control_measures cm
  LEFT JOIN control_measure_templates cmt ON cm.template_id = cmt.id
  WHERE cm.id = p_measure_id;
  
  -- Получить количество предоставленных типов доказательств
  -- Учитываем только approved доказательства
  SELECT COUNT(DISTINCT e.evidence_type_id)
  INTO v_provided_count
  FROM evidence_links el
  JOIN evidence e ON el.evidence_id = e.id
  WHERE el.control_measure_id = p_measure_id
    AND e.status = 'approved';
  
  -- Если нет требуемых типов (кастомная мера), считаем по наличию любых доказательств
  IF v_required_count IS NULL OR v_required_count = 0 THEN
    v_required_count := 1; -- Минимум одно доказательство
  END IF;
  
  v_result := jsonb_build_object(
    'required_count', v_required_count,
    'provided_count', COALESCE(v_provided_count, 0),
    'completion_percentage', 
      CASE 
        WHEN v_required_count = 0 THEN 100
        ELSE LEAST(100, (COALESCE(v_provided_count, 0)::FLOAT / v_required_count * 100)::INT)
      END
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_measure_completion(UUID) IS 
  'Calculates completion percentage for a control measure based on evidence coverage';

-- =====================================================
-- 2. Функция обновления статуса меры
-- =====================================================

CREATE OR REPLACE FUNCTION update_measure_status(p_measure_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_completion JSONB;
  v_completion_pct INT;
  v_new_status TEXT;
BEGIN
  -- Получить процент выполнения
  v_completion := calculate_measure_completion(p_measure_id);
  v_completion_pct := (v_completion->>'completion_percentage')::INT;
  
  -- Определить новый статус
  v_new_status := CASE
    WHEN v_completion_pct >= 100 THEN 'implemented'
    WHEN v_completion_pct > 0 THEN 'in_progress'
    ELSE 'planned'
  END;
  
  -- Обновить статус меры
  UPDATE control_measures
  SET 
    status = v_new_status,
    updated_at = NOW()
  WHERE id = p_measure_id
    AND status IS DISTINCT FROM v_new_status; -- Обновляем только если статус изменился
  
  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_measure_status(UUID) IS 
  'Updates control measure status based on evidence completion';

-- =====================================================
-- 3. Функция обновления статуса записи соответствия
-- =====================================================

CREATE OR REPLACE FUNCTION update_compliance_record_status(p_compliance_record_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_total_measures INT;
  v_implemented_measures INT;
  v_in_progress_measures INT;
  v_new_status TEXT;
BEGIN
  -- Подсчитать меры по статусам
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'implemented'),
    COUNT(*) FILTER (WHERE status = 'in_progress')
  INTO 
    v_total_measures,
    v_implemented_measures,
    v_in_progress_measures
  FROM control_measures
  WHERE compliance_record_id = p_compliance_record_id;
  
  -- Если нет мер, статус = not_applicable
  IF v_total_measures = 0 THEN
    v_new_status := 'not_applicable';
  -- Если все меры implemented, статус = compliant
  ELSIF v_implemented_measures = v_total_measures THEN
    v_new_status := 'compliant';
  -- Если есть in_progress или implemented, статус = partial
  ELSIF v_in_progress_measures > 0 OR v_implemented_measures > 0 THEN
    v_new_status := 'partial';
  -- Иначе статус = non_compliant
  ELSE
    v_new_status := 'non_compliant';
  END IF;
  
  -- Cast text to compliance_status enum type
  UPDATE compliance_records
  SET 
    status = v_new_status::compliance_status,
    updated_at = NOW()
  WHERE id = p_compliance_record_id
    AND status IS DISTINCT FROM v_new_status::compliance_status;
  
  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_compliance_record_status(UUID) IS 
  'Updates compliance record status by aggregating control measure statuses';

-- =====================================================
-- 4. Триггерная функция для каскадного обновления статусов
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_compliance_status()
RETURNS TRIGGER AS $$
DECLARE
  v_measure_id UUID;
  v_compliance_record_id UUID;
BEGIN
  -- Определить ID меры в зависимости от операции
  IF TG_OP = 'DELETE' THEN
    v_measure_id := OLD.control_measure_id;
  ELSE
    v_measure_id := NEW.control_measure_id;
  END IF;
  
  -- Если это изменение в evidence_links
  IF TG_TABLE_NAME = 'evidence_links' THEN
    -- Обновить статус меры только если control_measure_id не NULL
    IF v_measure_id IS NOT NULL THEN
      PERFORM update_measure_status(v_measure_id);
      
      -- Получить ID записи соответствия
      SELECT compliance_record_id INTO v_compliance_record_id
      FROM control_measures
      WHERE id = v_measure_id;
      
      -- Обновить статус записи соответствия
      IF v_compliance_record_id IS NOT NULL THEN
        PERFORM update_compliance_record_status(v_compliance_record_id);
      END IF;
    END IF;
  
  -- Если это изменение статуса evidence
  ELSIF TG_TABLE_NAME = 'evidence' THEN
    -- Обновить статусы всех мер, связанных с этим доказательством
    FOR v_measure_id IN 
      SELECT DISTINCT control_measure_id 
      FROM evidence_links 
      WHERE evidence_id = NEW.id
        AND control_measure_id IS NOT NULL
    LOOP
      PERFORM update_measure_status(v_measure_id);
      
      -- Получить ID записи соответствия
      SELECT compliance_record_id INTO v_compliance_record_id
      FROM control_measures
      WHERE id = v_measure_id;
      
      -- Обновить статус записи соответствия
      IF v_compliance_record_id IS NOT NULL THEN
        PERFORM update_compliance_record_status(v_compliance_record_id);
      END IF;
    END LOOP;
  
  -- Если это изменение в control_measures
  ELSIF TG_TABLE_NAME = 'control_measures' THEN
    IF TG_OP = 'DELETE' THEN
      v_compliance_record_id := OLD.compliance_record_id;
    ELSE
      v_compliance_record_id := NEW.compliance_record_id;
    END IF;
    
    -- Обновить статус записи соответствия
    IF v_compliance_record_id IS NOT NULL THEN
      PERFORM update_compliance_record_status(v_compliance_record_id);
    END IF;
  END IF;
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_update_compliance_status() IS 
  'Trigger function that cascades status updates from evidence → measures → compliance records';

-- =====================================================
-- 5. Применить триггеры к таблицам
-- =====================================================

-- Триггер на evidence_links (создание/удаление связей)
DROP TRIGGER IF EXISTS update_compliance_status_on_evidence_link ON evidence_links;
CREATE TRIGGER update_compliance_status_on_evidence_link
  AFTER INSERT OR DELETE ON evidence_links
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_compliance_status();

-- Триггер на evidence (изменение статуса доказательства)
DROP TRIGGER IF EXISTS update_compliance_status_on_evidence ON evidence;
CREATE TRIGGER update_compliance_status_on_evidence
  AFTER UPDATE OF status ON evidence
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_update_compliance_status();

-- Триггер на control_measures (создание/удаление мер)
DROP TRIGGER IF EXISTS update_compliance_status_on_measure ON control_measures;
CREATE TRIGGER update_compliance_status_on_measure
  AFTER INSERT OR DELETE ON control_measures
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_compliance_status();

-- =====================================================
-- 6. Функция для пересчёта всех статусов (для миграции)
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_all_statuses()
RETURNS TABLE(
  measures_updated INT,
  compliance_records_updated INT
) AS $$
DECLARE
  v_measures_updated INT := 0;
  v_compliance_updated INT := 0;
  v_measure_id UUID;
  v_compliance_id UUID;
BEGIN
  -- Обновить все меры
  FOR v_measure_id IN 
    SELECT id FROM control_measures
  LOOP
    PERFORM update_measure_status(v_measure_id);
    v_measures_updated := v_measures_updated + 1;
  END LOOP;
  
  -- Обновить все записи соответствия
  FOR v_compliance_id IN 
    SELECT id FROM compliance_records
  LOOP
    PERFORM update_compliance_record_status(v_compliance_id);
    v_compliance_updated := v_compliance_updated + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_measures_updated, v_compliance_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_all_statuses() IS 
  'Recalculates all measure and compliance record statuses (use for migration)';

-- =====================================================
-- 7. Пересчитать существующие статусы
-- =====================================================

DO $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM recalculate_all_statuses();
  
  RAISE NOTICE 'Status recalculation complete:';
  RAISE NOTICE '  - Measures updated: %', v_result.measures_updated;
  RAISE NOTICE '  - Compliance records updated: %', v_result.compliance_records_updated;
END $$;
