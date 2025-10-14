-- =====================================================
-- ОБНОВЛЕНИЕ СРОКОВ ДЛЯ СУЩЕСТВУЮЩИХ ШАБЛОНОВ
-- =====================================================
-- Добавление временных параметров для существующих control_templates
-- Версия: 1.0
-- Дата: 13 октября 2025

-- =====================================================
-- СТРАТЕГИЯ РАСЧЕТА СРОКОВ
-- =====================================================
-- 
-- estimated_implementation_days (срок внедрения):
-- - preventive (превентивные): 30-90 дней (требуют планирования)
-- - detective (детективные): 14-60 дней (быстрее внедряются)
-- - corrective (корректирующие): 7-30 дней (срочные)
-- - compensating (компенсирующие): 14-45 дней (средний приоритет)
--
-- Модификаторы по частоте:
-- - continuous, daily: короткие сроки (быстро внедрить)
-- - weekly, monthly: средние сроки
-- - quarterly, annually: длинные сроки (можно планировать)
--
-- validity_period_months (срок действия):
-- - continuous: NULL (постоянный мониторинг, не истекает)
-- - daily, weekly: 6 месяцев (часто пересматривать)
-- - monthly: 12 месяцев (стандарт)
-- - quarterly: 12 месяцев
-- - annually: 24 месяца (пересмотр раз в 2 года)
-- - on_demand: 12 месяцев (по умолчанию)

-- =====================================================
-- 1. ПРЕВЕНТИВНЫЕ МЕРЫ (preventive)
-- =====================================================

-- Continuous/Daily - быстрое внедрение, не истекают
UPDATE control_templates
SET 
  estimated_implementation_days = 30,  -- Быстро внедрить
  validity_period_months = NULL        -- Постоянный мониторинг
WHERE control_type = 'preventive'
  AND frequency IN ('continuous', 'daily')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Weekly/Monthly - среднее внедрение
UPDATE control_templates
SET 
  estimated_implementation_days = 45,
  validity_period_months = 12          -- Пересмотр через год
WHERE control_type = 'preventive'
  AND frequency IN ('weekly', 'monthly')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Quarterly - более длительное внедрение
UPDATE control_templates
SET 
  estimated_implementation_days = 60,
  validity_period_months = 12
WHERE control_type = 'preventive'
  AND frequency = 'quarterly'
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Annually - длительное планирование
UPDATE control_templates
SET 
  estimated_implementation_days = 90,
  validity_period_months = 24          -- Пересмотр через 2 года
WHERE control_type = 'preventive'
  AND frequency = 'annually'
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- On demand - средние значения
UPDATE control_templates
SET 
  estimated_implementation_days = 45,
  validity_period_months = 12
WHERE control_type = 'preventive'
  AND frequency = 'on_demand'
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- =====================================================
-- 2. ДЕТЕКТИВНЫЕ МЕРЫ (detective)
-- =====================================================

-- Continuous/Daily - очень быстро
UPDATE control_templates
SET 
  estimated_implementation_days = 14,  -- 2 недели
  validity_period_months = NULL        -- Постоянный мониторинг
WHERE control_type = 'detective'
  AND frequency IN ('continuous', 'daily')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Weekly/Monthly - быстро
UPDATE control_templates
SET 
  estimated_implementation_days = 30,
  validity_period_months = 12
WHERE control_type = 'detective'
  AND frequency IN ('weekly', 'monthly')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Quarterly - средне
UPDATE control_templates
SET 
  estimated_implementation_days = 45,
  validity_period_months = 12
WHERE control_type = 'detective'
  AND frequency = 'quarterly'
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Annually - стандартно
UPDATE control_templates
SET 
  estimated_implementation_days = 60,
  validity_period_months = 24
WHERE control_type = 'detective'
  AND frequency = 'annually'
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- On demand
UPDATE control_templates
SET 
  estimated_implementation_days = 30,
  validity_period_months = 12
WHERE control_type = 'detective'
  AND frequency = 'on_demand'
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- =====================================================
-- 3. КОРРЕКТИРУЮЩИЕ МЕРЫ (corrective)
-- =====================================================
-- Корректирующие меры обычно срочные!

-- Continuous/Daily - срочно!
UPDATE control_templates
SET 
  estimated_implementation_days = 7,   -- 1 неделя
  validity_period_months = 6           -- Частый пересмотр
WHERE control_type = 'corrective'
  AND frequency IN ('continuous', 'daily')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Weekly/Monthly - быстро
UPDATE control_templates
SET 
  estimated_implementation_days = 14,  -- 2 недели
  validity_period_months = 12
WHERE control_type = 'corrective'
  AND frequency IN ('weekly', 'monthly')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Quarterly - средне
UPDATE control_templates
SET 
  estimated_implementation_days = 30,
  validity_period_months = 12
WHERE control_type = 'corrective'
  AND frequency = 'quarterly'
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Annually/On demand
UPDATE control_templates
SET 
  estimated_implementation_days = 30,
  validity_period_months = 12
WHERE control_type = 'corrective'
  AND frequency IN ('annually', 'on_demand')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- =====================================================
-- 4. КОМПЕНСИРУЮЩИЕ МЕРЫ (compensating)
-- =====================================================

-- Continuous/Daily
UPDATE control_templates
SET 
  estimated_implementation_days = 21,  -- 3 недели
  validity_period_months = 6
WHERE control_type = 'compensating'
  AND frequency IN ('continuous', 'daily')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Weekly/Monthly
UPDATE control_templates
SET 
  estimated_implementation_days = 30,
  validity_period_months = 12
WHERE control_type = 'compensating'
  AND frequency IN ('weekly', 'monthly')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Quarterly
UPDATE control_templates
SET 
  estimated_implementation_days = 45,
  validity_period_months = 12
WHERE control_type = 'compensating'
  AND frequency = 'quarterly'
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- Annually/On demand
UPDATE control_templates
SET 
  estimated_implementation_days = 60,
  validity_period_months = 24
WHERE control_type = 'compensating'
  AND frequency IN ('annually', 'on_demand')
  AND (estimated_implementation_days IS NULL OR validity_period_months IS NULL);

-- =====================================================
-- 5. FALLBACK - для любых оставшихся
-- =====================================================

-- На случай если что-то пропустили
UPDATE control_templates
SET 
  estimated_implementation_days = 30,  -- Дефолт: месяц
  validity_period_months = 12          -- Дефолт: год
WHERE estimated_implementation_days IS NULL 
   OR validity_period_months IS NULL;

-- =====================================================
-- 6. СПЕЦИАЛЬНЫЕ СЛУЧАИ ДЛЯ РОССИЙСКОГО КОМПЛАЕНСА
-- =====================================================

-- КИИ - Категорирование (по 187-ФЗ)
UPDATE control_templates
SET 
  estimated_implementation_days = 180,  -- 6 месяцев
  validity_period_months = 60           -- 5 лет
WHERE (code LIKE '%КИИ%' OR code LIKE '%KII%' OR title ILIKE '%категориров%')
  AND title ILIKE '%категориров%';

-- КИИ - Инциденты (срочно!)
UPDATE control_templates
SET 
  estimated_implementation_days = 1,    -- 24 часа!
  validity_period_months = 12
WHERE (code LIKE '%КИИ%' OR code LIKE '%KII%')
  AND (title ILIKE '%инцидент%' OR title ILIKE '%атак%');

-- ПДн - Оценка эффективности (ежегодно по 152-ФЗ)
UPDATE control_templates
SET 
  estimated_implementation_days = 30,
  validity_period_months = 12           -- Ежегодно
WHERE (code LIKE '%ПДн%' OR code LIKE '%PDN%' OR code LIKE '%PERS%')
  AND (title ILIKE '%оценк%' OR title ILIKE '%эффективн%');

-- ПДн - Модель угроз (актуализация раз в год)
UPDATE control_templates
SET 
  estimated_implementation_days = 30,
  validity_period_months = 12
WHERE (code LIKE '%ПДн%' OR code LIKE '%PDN%')
  AND title ILIKE '%модель угроз%';

-- ФСТЭК - Базовые меры (Приказы №17, №21)
UPDATE control_templates
SET 
  estimated_implementation_days = 90,   -- 3 месяца
  validity_period_months = 12
WHERE (code LIKE 'FSTEC%' OR code LIKE 'ФСТЭК%')
  AND control_type = 'preventive';

-- =====================================================
-- 7. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- =====================================================

-- Показать обновленные шаблоны
SELECT 
  code,
  title,
  control_type,
  frequency,
  estimated_implementation_days,
  validity_period_months,
  CASE 
    WHEN estimated_implementation_days IS NULL THEN '❌ Нет срока внедрения'
    WHEN validity_period_months IS NULL THEN '⚠️ Без срока действия (норм для continuous)'
    ELSE '✅ Заполнено'
  END as status
FROM control_templates
ORDER BY 
  CASE WHEN estimated_implementation_days IS NULL THEN 0 ELSE 1 END,
  control_type,
  frequency;

-- Статистика по типам
SELECT 
  control_type,
  frequency,
  COUNT(*) as total,
  COUNT(estimated_implementation_days) as with_implementation_days,
  COUNT(validity_period_months) as with_validity_period,
  ROUND(AVG(estimated_implementation_days)) as avg_implementation_days,
  ROUND(AVG(validity_period_months)) as avg_validity_months
FROM control_templates
GROUP BY control_type, frequency
ORDER BY control_type, frequency;

-- Общая статистика
SELECT 
  COUNT(*) as total_templates,
  COUNT(estimated_implementation_days) as with_implementation_days,
  COUNT(validity_period_months) as with_validity_period,
  ROUND(AVG(estimated_implementation_days)) as avg_days,
  ROUND(AVG(validity_period_months)) as avg_months,
  MIN(estimated_implementation_days) as min_days,
  MAX(estimated_implementation_days) as max_days
FROM control_templates;

