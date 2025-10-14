-- Проверка и исправление tenant_id для всех типовых мер защиты
-- Убеждаемся, что все шаблоны имеют правильный tenant_id

-- Шаг 1: Показать статистику текущего состояния
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
    first_tenant_id UUID;
BEGIN
    -- Подсчитать шаблоны с NULL tenant_id
    SELECT COUNT(*) INTO null_count
    FROM control_measure_templates
    WHERE tenant_id IS NULL;
    
    -- Подсчитать общее количество шаблонов
    SELECT COUNT(*) INTO total_count
    FROM control_measure_templates;
    
    -- Получить ID первого тенанта
    SELECT id INTO first_tenant_id
    FROM tenants
    ORDER BY created_at ASC
    LIMIT 1;
    
    RAISE NOTICE 'Статистика типовых мер защиты:';
    RAISE NOTICE '  Всего шаблонов: %', total_count;
    RAISE NOTICE '  С NULL tenant_id: %', null_count;
    RAISE NOTICE '  Первый tenant_id: %', first_tenant_id;
    
    -- Обновить все шаблоны с NULL tenant_id
    IF null_count > 0 THEN
        UPDATE control_measure_templates
        SET tenant_id = first_tenant_id
        WHERE tenant_id IS NULL;
        
        RAISE NOTICE 'Обновлено % шаблонов с tenant_id = %', null_count, first_tenant_id;
    ELSE
        RAISE NOTICE 'Все шаблоны уже имеют tenant_id';
    END IF;
END $$;

-- Шаг 2: Проверить, что все шаблоны теперь имеют tenant_id
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK: Все типовые меры имеют tenant_id'
        ELSE 'ОШИБКА: ' || COUNT(*) || ' типовых мер без tenant_id'
    END as status
FROM control_measure_templates
WHERE tenant_id IS NULL;

-- Шаг 3: Показать распределение шаблонов по тенантам
SELECT 
    t.name as tenant_name,
    t.id as tenant_id,
    COUNT(cmt.id) as template_count
FROM tenants t
LEFT JOIN control_measure_templates cmt ON cmt.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY template_count DESC;
