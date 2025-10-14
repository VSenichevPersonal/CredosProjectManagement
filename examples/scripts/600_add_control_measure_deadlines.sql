-- =====================================================
-- ДОБАВЛЕНИЕ ВРЕМЕННЫХ ПАРАМЕТРОВ ДЛЯ МЕР КОНТРОЛЯ
-- =====================================================
-- Простая модель для отслеживания сроков реализации мер
-- Версия: 1.0
-- Дата: 13 октября 2025

-- =====================================================
-- 1. РАСШИРЕНИЕ control_templates
-- =====================================================

-- Добавление временных параметров в шаблоны
ALTER TABLE control_templates ADD COLUMN IF NOT EXISTS estimated_implementation_days INTEGER;
ALTER TABLE control_templates ADD COLUMN IF NOT EXISTS validity_period_months INTEGER;

-- Комментарии для понимания
COMMENT ON COLUMN control_templates.estimated_implementation_days IS 'Примерный срок внедрения меры в днях';
COMMENT ON COLUMN control_templates.validity_period_months IS 'Срок действия меры в месяцах (после которого требуется пересмотр)';

-- =====================================================
-- 2. РАСШИРЕНИЕ control_measures
-- =====================================================

-- Переименование существующего поля
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'control_measures' 
    AND column_name = 'implementation_date'
  ) THEN
    ALTER TABLE control_measures 
      RENAME COLUMN implementation_date TO actual_implementation_date;
  END IF;
END $$;

-- Добавление новых полей
ALTER TABLE control_measures ADD COLUMN IF NOT EXISTS target_implementation_date DATE;
ALTER TABLE control_measures ADD COLUMN IF NOT EXISTS actual_implementation_date DATE;
ALTER TABLE control_measures ADD COLUMN IF NOT EXISTS next_review_date DATE;
ALTER TABLE control_measures ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE control_measures ADD COLUMN IF NOT EXISTS days_until_due INTEGER;
ALTER TABLE control_measures ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false;

-- Комментарии
COMMENT ON COLUMN control_measures.target_implementation_date IS 'Плановая дата реализации меры (из requirement.deadline или расчет)';
COMMENT ON COLUMN control_measures.actual_implementation_date IS 'Фактическая дата реализации меры';
COMMENT ON COLUMN control_measures.next_review_date IS 'Дата следующей проверки (рассчитывается из frequency шаблона)';
COMMENT ON COLUMN control_measures.valid_until IS 'Срок действия меры (после которого требуется пересмотр)';
COMMENT ON COLUMN control_measures.days_until_due IS 'Количество дней до планового срока (отрицательное = просрочка)';
COMMENT ON COLUMN control_measures.is_overdue IS 'Признак просрочки реализации';

-- =====================================================
-- 3. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Индекс для поиска мер с приближающимся сроком
CREATE INDEX IF NOT EXISTS idx_control_measures_target_date 
  ON control_measures(target_implementation_date) 
  WHERE status IN ('planned', 'in_progress');

-- Индекс для поиска просроченных мер
CREATE INDEX IF NOT EXISTS idx_control_measures_overdue 
  ON control_measures(is_overdue) 
  WHERE is_overdue = true;

-- Индекс для поиска мер требующих проверки
CREATE INDEX IF NOT EXISTS idx_control_measures_next_review 
  ON control_measures(next_review_date) 
  WHERE status IN ('implemented', 'verified');

-- Индекс для поиска истекающих мер
CREATE INDEX IF NOT EXISTS idx_control_measures_valid_until 
  ON control_measures(valid_until) 
  WHERE valid_until IS NOT NULL;

-- =====================================================
-- 4. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО РАСЧЕТА ДАТ
-- =====================================================

CREATE OR REPLACE FUNCTION update_control_measure_dates()
RETURNS TRIGGER AS $$
DECLARE
  template_days INTEGER;
  template_months INTEGER;
  template_frequency VARCHAR(20);
  requirement_deadline TIMESTAMP;
BEGIN
  -- 1. Получить параметры из шаблона (если есть)
  IF NEW.template_id IS NOT NULL THEN
    SELECT 
      estimated_implementation_days,
      validity_period_months,
      frequency
    INTO template_days, template_months, template_frequency
    FROM control_templates
    WHERE id = NEW.template_id;
  END IF;
  
  -- 2. При создании меры - установить target_implementation_date
  IF TG_OP = 'INSERT' AND NEW.target_implementation_date IS NULL THEN
    
    -- Вариант А: Если есть deadline в requirement - использовать его
    SELECT deadline INTO requirement_deadline
    FROM requirements
    WHERE id = NEW.requirement_id;
    
    IF requirement_deadline IS NOT NULL THEN
      NEW.target_implementation_date := requirement_deadline::DATE;
      
      RAISE NOTICE 'Setting target date from requirement deadline: %', NEW.target_implementation_date;
    
    -- Вариант Б: Рассчитать из шаблона
    ELSIF template_days IS NOT NULL THEN
      NEW.target_implementation_date := CURRENT_DATE + template_days;
      
      RAISE NOTICE 'Setting target date from template (% days): %', template_days, NEW.target_implementation_date;
    END IF;
  END IF;
  
  -- 3. При внедрении меры - установить фактическую дату и производные даты
  IF NEW.status = 'implemented' AND (OLD IS NULL OR OLD.status != 'implemented') THEN
    -- Фактическая дата внедрения
    IF NEW.actual_implementation_date IS NULL THEN
      NEW.actual_implementation_date := CURRENT_DATE;
    END IF;
    
    -- Рассчитать срок действия меры
    IF template_months IS NOT NULL THEN
      NEW.valid_until := NEW.actual_implementation_date + (template_months || ' months')::INTERVAL;
      
      RAISE NOTICE 'Setting valid_until (% months): %', template_months, NEW.valid_until;
    END IF;
    
    -- Рассчитать следующую проверку из frequency шаблона
    IF template_frequency IS NOT NULL THEN
      NEW.next_review_date := CASE template_frequency
        WHEN 'daily' THEN NEW.actual_implementation_date + INTERVAL '1 day'
        WHEN 'weekly' THEN NEW.actual_implementation_date + INTERVAL '1 week'
        WHEN 'monthly' THEN NEW.actual_implementation_date + INTERVAL '1 month'
        WHEN 'quarterly' THEN NEW.actual_implementation_date + INTERVAL '3 months'
        WHEN 'annually' THEN NEW.actual_implementation_date + INTERVAL '1 year'
        WHEN 'on_demand' THEN NULL
        WHEN 'continuous' THEN NULL
        ELSE NULL
      END;
      
      RAISE NOTICE 'Setting next_review_date from frequency %: %', template_frequency, NEW.next_review_date;
    END IF;
  END IF;
  
  -- 4. Рассчитать days_until_due и is_overdue
  IF NEW.target_implementation_date IS NOT NULL THEN
    NEW.days_until_due := (NEW.target_implementation_date - CURRENT_DATE)::INTEGER;
    
    -- Просрочена, если прошел плановый срок и статус не "внедрена" или "проверена"
    NEW.is_overdue := (
      NEW.target_implementation_date < CURRENT_DATE 
      AND NEW.status IN ('planned', 'in_progress')
    );
    
    IF NEW.is_overdue THEN
      RAISE NOTICE 'Measure is overdue by % days', ABS(NEW.days_until_due);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удалить старый триггер если существует
DROP TRIGGER IF EXISTS trigger_update_control_measure_dates ON control_measures;

-- Создать новый триггер
CREATE TRIGGER trigger_update_control_measure_dates
  BEFORE INSERT OR UPDATE ON control_measures
  FOR EACH ROW
  EXECUTE FUNCTION update_control_measure_dates();

-- =====================================================
-- 5. ФУНКЦИЯ ДЛЯ ПЕРИОДИЧЕСКОГО ОБНОВЛЕНИЯ СТАТУСОВ
-- =====================================================

-- Функция для пометки просроченных мер (запускать через cron)
CREATE OR REPLACE FUNCTION mark_overdue_measures()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE control_measures
  SET is_overdue = true
  WHERE target_implementation_date IS NOT NULL
    AND target_implementation_date < CURRENT_DATE
    AND status IN ('planned', 'in_progress')
    AND is_overdue = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для пометки мер требующих проверки
CREATE OR REPLACE FUNCTION mark_measures_needing_review()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Можно добавить специальный статус 'needs_review' если нужно
  -- Пока просто возвращаем количество
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM control_measures
  WHERE next_review_date IS NOT NULL
    AND next_review_date <= CURRENT_DATE + INTERVAL '14 days'
    AND status IN ('implemented', 'verified');
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ДАННЫХ (ОПЦИОНАЛЬНО)
-- =====================================================

-- Установить estimated_implementation_days для существующих шаблонов (по умолчанию)
UPDATE control_templates
SET estimated_implementation_days = 
  CASE 
    WHEN frequency IN ('daily', 'weekly') THEN 7
    WHEN frequency = 'monthly' THEN 30
    WHEN frequency = 'quarterly' THEN 90
    WHEN frequency = 'annually' THEN 180
    ELSE 30
  END
WHERE estimated_implementation_days IS NULL;

-- Установить validity_period_months для существующих шаблонов
UPDATE control_templates
SET validity_period_months = 
  CASE 
    WHEN frequency IN ('daily', 'weekly', 'monthly') THEN 12  -- Год
    WHEN frequency = 'quarterly' THEN 12
    WHEN frequency = 'annually' THEN 24  -- Два года
    ELSE 12
  END
WHERE validity_period_months IS NULL;

-- =====================================================
-- 7. ПРАВА ДОСТУПА
-- =====================================================

-- Разрешить authenticated пользователям работать с новыми полями
GRANT SELECT, INSERT, UPDATE ON control_measures TO authenticated;
GRANT SELECT ON control_templates TO authenticated;

-- =====================================================
-- 8. ПРОВЕРОЧНЫЕ ЗАПРОСЫ
-- =====================================================

-- Проверить добавление полей в control_templates
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'control_templates'
  AND column_name IN ('estimated_implementation_days', 'validity_period_months')
ORDER BY ordinal_position;

-- Проверить добавление полей в control_measures
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'control_measures'
  AND column_name IN (
    'target_implementation_date', 
    'actual_implementation_date',
    'next_review_date',
    'valid_until',
    'days_until_due',
    'is_overdue'
  )
ORDER BY ordinal_position;

-- Проверить создание индексов
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'control_measures'
  AND indexname LIKE '%target_date%' 
     OR indexname LIKE '%overdue%'
     OR indexname LIKE '%review%'
     OR indexname LIKE '%valid_until%';

-- Статистика по мерам
SELECT 
  status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_overdue = true) as overdue_count,
  COUNT(*) FILTER (WHERE target_implementation_date IS NOT NULL) as with_target_date,
  COUNT(*) FILTER (WHERE actual_implementation_date IS NOT NULL) as implemented_count
FROM control_measures
GROUP BY status
ORDER BY status;

