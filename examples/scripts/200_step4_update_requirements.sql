-- Step 4: Update requirements with new architecture
-- This script updates requirements with proper suggested_control_measure_template_ids and measure_mode

-- First, let's see what control measure templates we have
SELECT id, code, title FROM control_measure_templates ORDER BY code;

-- Update requirements to have proper suggested measures based on keywords in titles

-- Using title instead of name, and mapping based on requirement content

-- For requirements about "Назначение ответственного" or "Ответственный"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%приказ%' OR title ILIKE '%назначен%' OR title ILIKE '%ответственн%'
    LIMIT 2
  ),
  measure_mode = 'flexible'
WHERE title ILIKE '%ответственн%' OR title ILIKE '%назначен%';

-- For requirements about "Антивирусная защита"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%антивирус%' OR title ILIKE '%защит%' OR code LIKE 'DP-%'
    LIMIT 2
  ),
  measure_mode = 'strict'
WHERE title ILIKE '%антивирус%';

-- For requirements about "Идентификация и аутентификация"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%идентификац%' OR title ILIKE '%аутентификац%' OR title ILIKE '%парол%' OR code LIKE 'AC-%'
    LIMIT 3
  ),
  measure_mode = 'flexible'
WHERE title ILIKE '%идентификац%' OR title ILIKE '%аутентификац%';

-- For requirements about "Журналирование" and "Регистрация событий"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%журнал%' OR title ILIKE '%регистрац%' OR title ILIKE '%событи%'
    LIMIT 2
  ),
  measure_mode = 'strict'
WHERE title ILIKE '%журнал%' OR title ILIKE '%регистрац%' OR title ILIKE '%событи%';

-- For requirements about "Резервное копирование"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%резервн%' OR title ILIKE '%копирован%' OR title ILIKE '%backup%'
    LIMIT 2
  ),
  measure_mode = 'strict'
WHERE title ILIKE '%резервн%' OR title ILIKE '%копирован%';

-- For requirements about "Контроль доступа"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%доступ%' OR code LIKE 'AC-%'
    LIMIT 2
  ),
  measure_mode = 'flexible'
WHERE title ILIKE '%контрол%доступ%' OR title ILIKE '%разграничен%доступ%';

-- For requirements about "Сетевая безопасность"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%сет%' OR title ILIKE '%межсетев%' OR code LIKE 'NS-%'
    LIMIT 2
  ),
  measure_mode = 'strict'
WHERE title ILIKE '%сет%' OR title ILIKE '%межсетев%';

-- For requirements about "Обнаружение вторжений" and "Мониторинг"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%обнаружен%' OR title ILIKE '%мониторинг%' OR title ILIKE '%анализ%'
    LIMIT 2
  ),
  measure_mode = 'flexible'
WHERE title ILIKE '%обнаружен%' OR title ILIKE '%мониторинг%';

-- For requirements about "Управление уязвимостями"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%уязвим%' OR title ILIKE '%обновлен%' OR code LIKE 'VM-%'
    LIMIT 2
  ),
  measure_mode = 'strict'
WHERE title ILIKE '%уязвим%' OR title ILIKE '%обновлен%';

-- For requirements about "Реагирование на инциденты"
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE title ILIKE '%инцидент%' OR title ILIKE '%реагирован%' OR code LIKE 'IR-%'
    LIMIT 2
  ),
  measure_mode = 'flexible'
WHERE title ILIKE '%инцидент%' OR title ILIKE '%реагирован%';

-- Default: assign generic templates to any requirements without measures
UPDATE requirements
SET 
  suggested_control_measure_template_ids = ARRAY(
    SELECT id FROM control_measure_templates 
    WHERE code LIKE 'CA-%' OR code LIKE 'AC-%'
    ORDER BY code
    LIMIT 2
  ),
  measure_mode = 'flexible'
WHERE suggested_control_measure_template_ids IS NULL 
   OR array_length(suggested_control_measure_template_ids, 1) IS NULL;

-- Verification query
SELECT 
  r.title,
  r.measure_mode,
  array_length(r.suggested_control_measure_template_ids, 1) AS templates_count,
  (
    SELECT array_agg(cmt.title)
    FROM control_measure_templates cmt
    WHERE cmt.id = ANY(r.suggested_control_measure_template_ids)
  ) AS template_names
FROM requirements r
WHERE r.tenant_id = '11111111-1111-1111-1111-111111111111'
ORDER BY r.title
LIMIT 10;
