-- Завершение миграции типов организаций с enum на справочник
-- Этот скрипт завершает переход от organization_type enum к таблице organization_types

-- Шаг 1: Убедимся что таблица organization_types существует
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_types') THEN
    RAISE EXCEPTION 'Table organization_types does not exist. Run script 136 first.';
  END IF;
END $$;

-- Шаг 2: Добавляем колонку type_id если её нет
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES organization_types(id);

-- Шаг 3: Создаем временную функцию для миграции данных
CREATE OR REPLACE FUNCTION migrate_organization_type_to_id() 
RETURNS void AS $$
DECLARE
  org_record RECORD;
  type_code VARCHAR(50);
BEGIN
  -- Проверяем есть ли старая колонка type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'type'
  ) THEN
    -- Мигрируем данные из enum в справочник
    FOR org_record IN 
      SELECT id, type::text as type_value 
      FROM organizations 
      WHERE type IS NOT NULL AND type_id IS NULL
    LOOP
      -- Маппинг старых enum значений на коды справочника
      type_code := CASE org_record.type_value
        WHEN 'ministry' THEN 'ministry'
        WHEN 'department' THEN 'department'
        WHEN 'agency' THEN 'agency'
        WHEN 'service' THEN 'service'
        WHEN 'institution' THEN 'institution'
        WHEN 'enterprise' THEN 'enterprise'
        WHEN 'other' THEN 'other'
        ELSE 'other'
      END;
      
      -- Обновляем type_id
      UPDATE organizations 
      SET type_id = (SELECT id FROM organization_types WHERE code = type_code LIMIT 1)
      WHERE id = org_record.id;
    END LOOP;
    
    RAISE NOTICE 'Migrated organization types from enum to dictionary';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Шаг 4: Выполняем миграцию
SELECT migrate_organization_type_to_id();

-- Шаг 5: Удаляем временную функцию
DROP FUNCTION IF EXISTS migrate_organization_type_to_id();

-- Шаг 6: Создаем индекс для type_id
CREATE INDEX IF NOT EXISTS idx_organizations_type_id ON organizations(type_id);

-- Шаг 7: Добавляем комментарий
COMMENT ON COLUMN organizations.type_id IS 'Ссылка на справочник типов организаций';

-- Шаг 8: Опционально - удаляем старую колонку type (закомментировано для безопасности)
-- ALTER TABLE organizations DROP COLUMN IF EXISTS type;

-- Шаг 9: Опционально - удаляем старый enum (закомментировано для безопасности)
-- DROP TYPE IF EXISTS organization_type;

SELECT 'Organization types migration completed successfully' as status;
