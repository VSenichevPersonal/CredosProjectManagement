-- =====================================================
-- Валидация режимов мер (strict/flexible)
-- =====================================================
-- Версия: 1.0
-- Дата: 2025-01-10
-- Описание: Добавляет проверку, что в strict режиме нельзя
--           создавать кастомные меры без шаблона

-- =====================================================
-- 1. Функция для проверки режима мер
-- =====================================================

CREATE OR REPLACE FUNCTION validate_measure_mode()
RETURNS TRIGGER AS $$
DECLARE
  v_measure_mode TEXT;
  v_requirement_code TEXT;
BEGIN
  -- Получить режим мер из требования через compliance record
  SELECT r.measure_mode, r.code
  INTO v_measure_mode, v_requirement_code
  FROM compliance_records cr
  JOIN requirements r ON cr.requirement_id = r.id
  WHERE cr.id = NEW.compliance_record_id;
  
  -- Если режим strict и мера не из шаблона - ошибка
  IF v_measure_mode = 'strict' AND NEW.template_id IS NULL THEN
    RAISE EXCEPTION 'Cannot create custom measures in strict mode for requirement %. Only template-based measures are allowed.', 
      v_requirement_code
      USING HINT = 'Use suggested control measure templates or change requirement to flexible mode';
  END IF;
  
  -- Если режим flexible - разрешаем любые меры
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_measure_mode() IS 
  'Validates that custom measures cannot be created when requirement is in strict mode';

-- =====================================================
-- 2. Применить триггер к control_measures
-- =====================================================

DROP TRIGGER IF EXISTS validate_measure_mode_trigger ON control_measures;
CREATE TRIGGER validate_measure_mode_trigger
  BEFORE INSERT OR UPDATE OF template_id ON control_measures
  FOR EACH ROW
  EXECUTE FUNCTION validate_measure_mode();

COMMENT ON TRIGGER validate_measure_mode_trigger ON control_measures IS 
  'Prevents creation of custom measures when requirement is in strict mode';

-- =====================================================
-- 3. Добавить индекс для быстрой проверки режима
-- =====================================================

-- Removed deleted_at check from WHERE clause
CREATE INDEX IF NOT EXISTS idx_requirements_measure_mode 
  ON requirements(measure_mode, tenant_id);

-- =====================================================
-- 4. Проверить существующие данные
-- =====================================================

DO $$
DECLARE
  v_invalid_count INT;
BEGIN
  -- Removed deleted_at check
  -- Подсчитать количество кастомных мер в strict режиме
  SELECT COUNT(*)
  INTO v_invalid_count
  FROM control_measures cm
  JOIN compliance_records cr ON cm.compliance_record_id = cr.id
  JOIN requirements r ON cr.requirement_id = r.id
  WHERE cm.template_id IS NULL
    AND r.measure_mode = 'strict';
  
  IF v_invalid_count > 0 THEN
    RAISE WARNING 'Found % custom measures in strict mode requirements. These should be reviewed.', v_invalid_count;
  ELSE
    RAISE NOTICE 'All measures comply with mode restrictions.';
  END IF;
END $$;
