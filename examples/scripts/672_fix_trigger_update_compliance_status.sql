-- =====================================================
-- МИГРАЦИЯ 672: ИСПРАВЛЕНИЕ ТРИГГЕРА trigger_update_compliance_status
-- =====================================================
-- Stage: 17
-- Дата: 13 октября 2025
-- 
-- ПРОБЛЕМА:
-- Функция trigger_update_compliance_status() пыталась обработать
-- таблицу evidence и обращалась к полю control_measure_id,
-- которого там нет. Это вызывало ошибку:
-- "record "new" has no field "compliance_record_id"
--
-- РЕШЕНИЕ:
-- 1. Убрать обработку таблицы evidence из функции
-- 2. Оставить только control_measures и evidence_links
-- 3. Правильно получать compliance_record_id для evidence_links

-- =====================================================
-- 1. ИСПРАВЛЕННАЯ ФУНКЦИЯ
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_update_compliance_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_compliance_record_id UUID;
  v_measure_id UUID;
  v_total_measures INTEGER;
  v_completed_measures INTEGER;
  v_new_status TEXT;
BEGIN
  -- =====================================================
  -- ОПРЕДЕЛЕНИЕ compliance_record_id
  -- =====================================================
  
  -- Для control_measures - берём напрямую
  IF TG_TABLE_NAME = 'control_measures' THEN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      v_compliance_record_id := NEW.compliance_record_id;
      v_measure_id := NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
      v_compliance_record_id := OLD.compliance_record_id;
      v_measure_id := OLD.id;
    END IF;
  END IF;

  -- Для evidence_links - получаем через JOIN с control_measures
  IF TG_TABLE_NAME = 'evidence_links' THEN
    IF TG_OP = 'DELETE' THEN
      -- Для DELETE используем OLD
      SELECT cm.compliance_record_id 
      INTO v_compliance_record_id
      FROM control_measures cm
      WHERE cm.id = OLD.control_measure_id;
    ELSE
      -- Для INSERT/UPDATE используем NEW
      SELECT cm.compliance_record_id 
      INTO v_compliance_record_id
      FROM control_measures cm
      WHERE cm.id = NEW.control_measure_id;
    END IF;
  END IF;

  -- Если не нашли compliance_record_id - просто выходим
  IF v_compliance_record_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- =====================================================
  -- РАСЧЁТ СТАТУСА COMPLIANCE
  -- =====================================================
  
  -- Считаем общее количество мер и выполненных
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (
      WHERE status IN ('implemented', 'verified')
      OR EXISTS (
        SELECT 1 FROM evidence_links el
        WHERE el.control_measure_id = cm.id
      )
    ) as completed
  INTO v_total_measures, v_completed_measures
  FROM control_measures cm
  WHERE cm.compliance_record_id = v_compliance_record_id;

  -- Определяем новый статус
  IF v_total_measures = 0 THEN
    v_new_status := 'pending';
  ELSIF v_completed_measures = 0 THEN
    v_new_status := 'pending';
  ELSIF v_completed_measures < v_total_measures THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'compliant';
  END IF;

  -- =====================================================
  -- ОБНОВЛЕНИЕ СТАТУСА
  -- =====================================================
  
  UPDATE compliance_records
  SET 
    status = v_new_status::compliance_status,
    updated_at = NOW()
  WHERE id = v_compliance_record_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- =====================================================
-- 2. ВКЛЮЧАЕМ ТРИГГЕРЫ ОБРАТНО
-- =====================================================

-- Включаем триггеры на evidence
ALTER TABLE evidence ENABLE TRIGGER evidence_status_change;
ALTER TABLE evidence ENABLE TRIGGER trigger_update_document_lifecycle_dates;

-- Включаем триггер на evidence_links
ALTER TABLE evidence_links ENABLE TRIGGER evidence_link_change;

-- =====================================================
-- 3. ПРОВЕРКА
-- =====================================================

SELECT 'Trigger fixed and re-enabled!' as status;

-- Проверяем статус триггеров
SELECT 
  t.tgrelid::regclass as table_name,
  t.tgname as trigger_name,
  p.proname as function_name,
  CASE t.tgenabled 
    WHEN 'O' THEN '✅ ENABLED'
    WHEN 'D' THEN '❌ DISABLED'
    ELSE t.tgenabled::text
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname IN (
  'trigger_update_compliance_status',
  'update_document_lifecycle_dates',
  'update_evidence_updated_at'
)
  AND NOT t.tgisinternal
ORDER BY t.tgrelid::regclass::text, t.tgname;

-- =====================================================
-- ПРИМЕЧАНИЯ
-- =====================================================
-- 
-- Изменения в функции:
-- 1. ❌ УБРАНА обработка таблицы 'evidence' (там нет control_measure_id)
-- 2. ✅ Обработка control_measures - без изменений
-- 3. ✅ Обработка evidence_links - правильный JOIN с control_measures
-- 4. ✅ Добавлена проверка на NULL compliance_record_id
-- 
-- Триггеры включены обратно:
-- - evidence_status_change (UPDATE на evidence)
-- - trigger_update_document_lifecycle_dates (INSERT/UPDATE на evidence)
-- - evidence_link_change (INSERT/UPDATE/DELETE на evidence_links)
-- 
-- Теперь загрузка доказательств должна работать полностью!
-- =====================================================

