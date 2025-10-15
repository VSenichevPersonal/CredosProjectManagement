-- Migration: Customers and Activities (Справочники для timesheet)
-- Description: Добавляем таблицы для клиентов и видов деятельности
-- Author: AI Product Owner & Architect
-- Date: 2025-10-15
-- Inspired by: Kimai, Timetta, Toggl best practices

-- ============================================================================
-- CUSTOMERS (Клиенты)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(300), -- Полное юридическое наименование (ООО "Рога и копыта")
  inn VARCHAR(12), -- ИНН для РФ
  kpp VARCHAR(9), -- КПП для РФ
  contact_person VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_inn ON customers(inn) WHERE inn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Комментарии
COMMENT ON TABLE customers IS 'Справочник клиентов (заказчиков проектов)';
COMMENT ON COLUMN customers.id IS 'Уникальный идентификатор';
COMMENT ON COLUMN customers.name IS 'Короткое название (для UI)';
COMMENT ON COLUMN customers.legal_name IS 'Полное юр. название';
COMMENT ON COLUMN customers.inn IS 'ИНН (для РФ)';
COMMENT ON COLUMN customers.kpp IS 'КПП (для РФ)';

-- Триггер для auto-update updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- ============================================================================
-- ACTIVITIES (Виды деятельности)
-- ============================================================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3B82F6', -- Цвет для визуализации (hex)
  default_hourly_rate DECIMAL(10,2) DEFAULT 0, -- Базовая ставка за час
  is_billable BOOLEAN DEFAULT true, -- Оплачиваемый ли вид работ
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_activities_name ON activities(name);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);
CREATE INDEX IF NOT EXISTS idx_activities_is_billable ON activities(is_billable);

-- Комментарии
COMMENT ON TABLE activities IS 'Справочник видов деятельности (разработка, дизайн, встречи и т.д.)';
COMMENT ON COLUMN activities.name IS 'Название вида деятельности';
COMMENT ON COLUMN activities.is_billable IS 'Оплачивается ли клиенту (billable/non-billable)';
COMMENT ON COLUMN activities.default_hourly_rate IS 'Базовая ставка за этот вид работ';

-- Триггер для auto-update updated_at
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activities_updated_at ON activities;

CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- ============================================================================
-- СВЯЗЬ С СУЩЕСТВУЮЩИМИ ТАБЛИЦАМИ
-- ============================================================================

-- Добавить customer_id к проектам
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN customer_id UUID REFERENCES customers(id);
    CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
    COMMENT ON COLUMN projects.customer_id IS 'Клиент (заказчик) проекта';
  END IF;
END $$;

-- Добавить activity_id к time_entries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'activity_id'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN activity_id UUID REFERENCES activities(id);
    CREATE INDEX IF NOT EXISTS idx_time_entries_activity_id ON time_entries(activity_id);
    COMMENT ON COLUMN time_entries.activity_id IS 'Вид деятельности (разработка, дизайн, встреча)';
  END IF;
END $$;

-- ============================================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ (Seed Data)
-- ============================================================================

-- Предустановленные Activities (если таблица пустая)
INSERT INTO activities (name, description, color, default_hourly_rate, is_billable)
VALUES 
  ('Разработка', 'Программирование, код', '#3B82F6', 3000, true),
  ('Код-ревью', 'Проверка кода коллег', '#8B5CF6', 2500, true),
  ('Дизайн', 'UI/UX дизайн', '#EC4899', 2800, true),
  ('Тестирование', 'QA, тестирование', '#10B981', 2200, true),
  ('Встречи', 'Совещания, планирование', '#F59E0B', 2000, true),
  ('Документирование', 'Написание документации', '#6366F1', 1800, true),
  ('Исследование', 'R&D, исследования', '#14B8A6', 2500, true),
  ('Обучение', 'Обучение, менторство', '#84CC16', 0, false),
  ('Админ задачи', 'Административные работы', '#64748B', 0, false),
  ('Отпуск/Больничный', 'Отсутствие', '#EF4444', 0, false)
ON CONFLICT (name) DO NOTHING;

-- Пример клиента (если нужен для демо)
-- INSERT INTO customers (name, legal_name, inn, contact_person, email)
-- VALUES ('ООО "Ромашка"', 'Общество с ограниченной ответственностью "Ромашка"', '7707083893', 'Иванов И.И.', 'ivanov@romashka.ru')
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- ПРОВЕРКА ЦЕЛОСТНОСТИ
-- ============================================================================

-- Проверяем что таблицы созданы
DO $$
DECLARE
  customers_count INTEGER;
  activities_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO customers_count FROM customers;
  SELECT COUNT(*) INTO activities_count FROM activities;
  
  RAISE NOTICE '✓ Customers table: % records', customers_count;
  RAISE NOTICE '✓ Activities table: % records (% preloaded)', activities_count, activities_count;
  
  IF activities_count >= 5 THEN
    RAISE NOTICE '✓ Activities preloaded successfully';
  END IF;
END $$;

