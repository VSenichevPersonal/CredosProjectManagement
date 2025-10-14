-- =====================================================
-- ЖИЗНЕННЫЙ ЦИКЛ ДОКУМЕНТОВ (МИНИМАЛЬНАЯ РЕАЛИЗАЦИЯ)
-- =====================================================
-- Добавление полей для отслеживания жизненного цикла документов
-- Интеграция со сроками мер контроля
-- Версия: 1.0
-- Дата: 13 октября 2025

-- =====================================================
-- 1. ENUM ДЛЯ СТАТУСА ЖИЗНЕННОГО ЦИКЛА
-- =====================================================

-- Создаем ENUM для жизненного цикла документа
DO $$ BEGIN
  CREATE TYPE document_lifecycle AS ENUM (
    'draft',        -- Черновик
    'active',       -- Действует
    'archived',     -- Архивирован
    'destroyed'     -- Уничтожен
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE document_lifecycle IS 'Статус жизненного цикла документа: draft, active, archived, destroyed';

-- =====================================================
-- 2. РАСШИРЕНИЕ ТАБЛИЦЫ EVIDENCE
-- =====================================================

-- Добавляем поля жизненного цикла
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS lifecycle_status document_lifecycle DEFAULT 'draft';

-- Реквизиты документа (обязательно для РФ)
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS document_number VARCHAR(100);
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS document_date DATE;

-- Период действия документа
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS effective_from DATE;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS effective_until DATE;

-- Срок хранения (российское делопроизводство)
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS retention_period_years INTEGER;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS destruction_date DATE;

-- Утверждение документа
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS approved_at DATE;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- 3. КОММЕНТАРИИ ДЛЯ ПОНИМАНИЯ
-- =====================================================

COMMENT ON COLUMN evidence.lifecycle_status IS 'Статус жизненного цикла: draft, active, archived, destroyed';
COMMENT ON COLUMN evidence.document_number IS 'Номер документа (например: №123-ИБ от 01.10.2025)';
COMMENT ON COLUMN evidence.document_date IS 'Дата документа (от какого числа)';
COMMENT ON COLUMN evidence.effective_from IS 'Документ действует С (может отличаться от document_date)';
COMMENT ON COLUMN evidence.effective_until IS 'Документ действует ДО';
COMMENT ON COLUMN evidence.retention_period_years IS 'Срок хранения документа в годах (3, 5, 10, 75, null=постоянно)';
COMMENT ON COLUMN evidence.destruction_date IS 'Дата планового уничтожения документа';
COMMENT ON COLUMN evidence.approved_at IS 'Когда документ был утвержден';
COMMENT ON COLUMN evidence.approved_by IS 'Кто утвердил документ';

-- =====================================================
-- 4. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Индекс для фильтрации по статусу жизненного цикла
CREATE INDEX IF NOT EXISTS idx_evidence_lifecycle_status 
  ON evidence(lifecycle_status);

-- Индекс для поиска активных документов
CREATE INDEX IF NOT EXISTS idx_evidence_active 
  ON evidence(lifecycle_status) 
  WHERE lifecycle_status = 'active';

-- Индекс для документов с датой
CREATE INDEX IF NOT EXISTS idx_evidence_document_date 
  ON evidence(document_date) 
  WHERE document_date IS NOT NULL;

-- Индекс для документов требующих уничтожения
CREATE INDEX IF NOT EXISTS idx_evidence_destruction_date 
  ON evidence(destruction_date) 
  WHERE destruction_date IS NOT NULL AND lifecycle_status != 'destroyed';

-- Индекс для поиска документов по периоду действия
CREATE INDEX IF NOT EXISTS idx_evidence_effective_period 
  ON evidence(effective_from, effective_until) 
  WHERE effective_from IS NOT NULL OR effective_until IS NOT NULL;

-- =====================================================
-- 5. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО РАСЧЕТА ДАТЕ
-- =====================================================

CREATE OR REPLACE FUNCTION update_document_lifecycle_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- При утверждении документа (approved_at заполнен)
  IF NEW.approved_at IS NOT NULL AND (OLD IS NULL OR OLD.approved_at IS NULL) THEN
    
    -- Если lifecycle_status был draft, переводим в active
    IF NEW.lifecycle_status = 'draft' THEN
      NEW.lifecycle_status := 'active';
    END IF;
    
    -- Если не указан effective_from, устанавливаем approved_at
    IF NEW.effective_from IS NULL THEN
      NEW.effective_from := NEW.approved_at;
    END IF;
    
    RAISE NOTICE 'Document approved, status changed to active, effective_from set';
  END IF;
  
  -- Рассчитываем destruction_date на основе retention_period_years
  IF NEW.retention_period_years IS NOT NULL AND NEW.destruction_date IS NULL THEN
    -- Считаем от effective_from или uploaded_at
    IF NEW.effective_from IS NOT NULL THEN
      NEW.destruction_date := NEW.effective_from + (NEW.retention_period_years || ' years')::INTERVAL;
    ELSIF NEW.uploaded_at IS NOT NULL THEN
      NEW.destruction_date := NEW.uploaded_at + (NEW.retention_period_years || ' years')::INTERVAL;
    END IF;
    
    RAISE NOTICE 'Destruction date calculated: %', NEW.destruction_date;
  END IF;
  
  -- Если наступила destruction_date и статус active/archived, переводим в destroyed
  IF NEW.destruction_date IS NOT NULL 
     AND NEW.destruction_date <= CURRENT_DATE 
     AND NEW.lifecycle_status IN ('active', 'archived') THEN
    
    NEW.lifecycle_status := 'destroyed';
    RAISE NOTICE 'Document marked as destroyed due to destruction_date';
  END IF;
  
  -- Если наступила effective_until и статус active, переводим в archived
  IF NEW.effective_until IS NOT NULL 
     AND NEW.effective_until < CURRENT_DATE 
     AND NEW.lifecycle_status = 'active' THEN
    
    NEW.lifecycle_status := 'archived';
    RAISE NOTICE 'Document archived due to effective_until date';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS trigger_update_document_lifecycle_dates ON evidence;

-- Создаем новый триггер
CREATE TRIGGER trigger_update_document_lifecycle_dates
  BEFORE INSERT OR UPDATE ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_document_lifecycle_dates();

-- =====================================================
-- 6. ФУНКЦИЯ ДЛЯ ПЕРИОДИЧЕСКОГО ОБНОВЛЕНИЯ СТАТУСОВ
-- =====================================================

-- Функция для архивирования истекших документов
CREATE OR REPLACE FUNCTION archive_expired_documents()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE evidence
  SET lifecycle_status = 'archived'
  WHERE lifecycle_status = 'active'
    AND effective_until IS NOT NULL
    AND effective_until < CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для уничтожения документов по сроку
CREATE OR REPLACE FUNCTION destroy_documents_by_retention()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE evidence
  SET lifecycle_status = 'destroyed'
  WHERE lifecycle_status IN ('active', 'archived')
    AND destruction_date IS NOT NULL
    AND destruction_date <= CURRENT_DATE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ДАННЫХ
-- =====================================================

-- Установить lifecycle_status = 'active' для уже загруженных документов
UPDATE evidence
SET lifecycle_status = 'active'
WHERE lifecycle_status IS NULL
  AND uploaded_at IS NOT NULL
  AND status IN ('approved', 'pending');

-- Для документов с expires_at установить effective_until
UPDATE evidence
SET effective_until = expires_at::DATE
WHERE expires_at IS NOT NULL
  AND effective_until IS NULL;

-- Для документов с next_review_date установить retention по умолчанию
UPDATE evidence
SET retention_period_years = 5  -- По умолчанию 5 лет для документов ИБ
WHERE retention_period_years IS NULL
  AND is_document = true;

-- =====================================================
-- 8. СВЯЗЬ С МЕРАМИ КОНТРОЛЯ (ВАЖНО!)
-- =====================================================

-- Создаем VIEW для связи документов и мер
CREATE OR REPLACE VIEW v_document_measure_timeline AS
SELECT 
  e.id as evidence_id,
  e.file_name,
  e.document_number,
  e.document_date,
  e.lifecycle_status as doc_lifecycle,
  e.effective_from as doc_effective_from,
  e.effective_until as doc_effective_until,
  e.destruction_date as doc_destruction_date,
  
  cm.id as measure_id,
  cm.title as measure_title,
  cm.status as measure_status,
  cm.target_implementation_date as measure_target_date,
  cm.actual_implementation_date as measure_actual_date,
  cm.next_review_date as measure_next_review,
  cm.valid_until as measure_valid_until,
  
  -- Флаги согласованности
  CASE 
    WHEN e.effective_from IS NOT NULL 
         AND cm.actual_implementation_date IS NOT NULL
         AND e.effective_from <= cm.actual_implementation_date 
    THEN true 
    ELSE false 
  END as document_ready_for_measure,
  
  CASE 
    WHEN e.effective_until IS NOT NULL 
         AND cm.valid_until IS NOT NULL
         AND e.effective_until < cm.valid_until
    THEN true
    ELSE false
  END as document_expires_before_measure
  
FROM evidence e
LEFT JOIN evidence_links el ON el.evidence_id = e.id
LEFT JOIN control_measures cm ON cm.id = el.control_measure_id
WHERE e.is_document = true;

COMMENT ON VIEW v_document_measure_timeline IS 'Связь сроков документов и мер контроля для анализа согласованности';

-- =====================================================
-- 9. ПРОВЕРОЧНЫЕ ЗАПРОСЫ
-- =====================================================

-- Статистика по статусам жизненного цикла
SELECT 
  lifecycle_status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_document = true) as documents_count,
  COUNT(*) FILTER (WHERE document_number IS NOT NULL) as with_number,
  COUNT(*) FILTER (WHERE effective_from IS NOT NULL) as with_effective_from,
  COUNT(*) FILTER (WHERE destruction_date IS NOT NULL) as with_destruction_date
FROM evidence
GROUP BY lifecycle_status
ORDER BY lifecycle_status;

-- Документы требующие внимания
SELECT 
  'Без номера и даты' as issue,
  COUNT(*) as count
FROM evidence
WHERE is_document = true
  AND (document_number IS NULL OR document_date IS NULL)
  AND lifecycle_status IN ('active', 'draft')

UNION ALL

SELECT 
  'Истек срок действия' as issue,
  COUNT(*) as count
FROM evidence
WHERE effective_until IS NOT NULL
  AND effective_until < CURRENT_DATE
  AND lifecycle_status = 'active'

UNION ALL

SELECT 
  'Требуют уничтожения' as issue,
  COUNT(*) as count
FROM evidence
WHERE destruction_date IS NOT NULL
  AND destruction_date <= CURRENT_DATE
  AND lifecycle_status != 'destroyed'

UNION ALL

SELECT 
  'Без срока хранения' as issue,
  COUNT(*) as count
FROM evidence
WHERE is_document = true
  AND retention_period_years IS NULL
  AND lifecycle_status IN ('active', 'draft');

-- =====================================================
-- 10. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- =====================================================

-- Пример 1: Политика ИБ (постоянное хранение)
/*
INSERT INTO evidence (
  file_name, file_url, file_type, file_size,
  title, is_document, uploaded_by,
  document_number, document_date,
  effective_from,
  retention_period_years,
  lifecycle_status
) VALUES (
  'Политика_ИБ.pdf', '/storage/policy.pdf', 'application/pdf', 1024000,
  'Политика информационной безопасности', true, 'user_id',
  '№12-ИБ', '2025-10-01',
  '2025-11-01',  -- Вступает в силу через месяц
  NULL,  -- Постоянное хранение
  'draft'
);
*/

-- Пример 2: Акт категорирования КИИ (5 лет)
/*
INSERT INTO evidence (
  file_name, file_url, file_type, file_size,
  title, is_document, uploaded_by,
  document_number, document_date,
  effective_from, effective_until,
  retention_period_years,
  lifecycle_status
) VALUES (
  'Акт_КИИ.pdf', '/storage/kii_act.pdf', 'application/pdf', 2048000,
  'Акт категорирования объектов КИИ', true, 'user_id',
  '№45-КИИ', '2025-10-01',
  '2025-10-01', '2030-10-01',  -- Действует 5 лет
  10,  -- Хранить 10 лет
  'active'
);
*/

-- =====================================================
-- ГОТОВО!
-- =====================================================

SELECT 'Document lifecycle system ready!' as status;

