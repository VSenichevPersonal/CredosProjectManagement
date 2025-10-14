-- Миграция: переход от enum type к справочнику organization_types
-- Этот скрипт заполняет type_id, делает его обязательным и удаляет старое поле type

-- Улучшенный маппинг с проверкой существования типов
-- 1. Заполняем type_id для всех существующих организаций на основе старого поля type
UPDATE organizations o
SET type_id = (
  SELECT id FROM organization_types ot
  WHERE ot.code = CASE o.type
    WHEN 'regulator' THEN 'ministry'  -- регулятор → министерство
    WHEN 'ministry' THEN 'ministry'   -- министерство → министерство
    WHEN 'institution' THEN 'hospital' -- учреждение → больница (по умолчанию)
    ELSE 'ministry'
  END
  LIMIT 1
)
WHERE type_id IS NULL AND type IS NOT NULL;

-- Для организаций без type используем тип по умолчанию
UPDATE organizations o
SET type_id = (SELECT id FROM organization_types WHERE code = 'ministry' LIMIT 1)
WHERE type_id IS NULL;

-- 2. Проверяем, что все организации имеют type_id
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM organizations
  WHERE type_id IS NULL;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Ошибка: % организаций не имеют type_id. Миграция прервана.', missing_count;
  ELSE
    RAISE NOTICE 'Все организации имеют type_id. Продолжаем миграцию.';
  END IF;
END $$;

-- 3. Делаем type_id обязательным полем
ALTER TABLE organizations ALTER COLUMN type_id SET NOT NULL;

-- 4. Удаляем старое поле type
ALTER TABLE organizations DROP COLUMN IF EXISTS type;

-- 5. Удаляем enum organization_type
DROP TYPE IF EXISTS organization_type;

-- 6. Вывод результата
SELECT 
  'Миграция завершена успешно' as status,
  COUNT(*) as organizations_with_type_id
FROM organizations
WHERE type_id IS NOT NULL;
