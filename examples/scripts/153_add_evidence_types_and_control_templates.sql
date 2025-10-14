-- Создание таблиц для типов доказательств и шаблонов мер

-- Типы доказательств (справочник)
CREATE TABLE IF NOT EXISTS evidence_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_format_regex VARCHAR(255),
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Шаблоны мер контроля
CREATE TABLE IF NOT EXISTS control_measure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  implementation_guide TEXT,
  estimated_effort VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(requirement_id, code)
);

-- Добавление полей в requirements для режимов исполнения
ALTER TABLE requirements 
  ADD COLUMN IF NOT EXISTS measure_mode VARCHAR(20) DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS evidence_type_mode VARCHAR(20) DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS allowed_evidence_type_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS suggested_control_measure_template_ids UUID[] DEFAULT '{}';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_evidence_types_code ON evidence_types(code);
CREATE INDEX IF NOT EXISTS idx_evidence_types_active ON evidence_types(is_active);
CREATE INDEX IF NOT EXISTS idx_control_measure_templates_requirement ON control_measure_templates(requirement_id);
CREATE INDEX IF NOT EXISTS idx_control_measure_templates_active ON control_measure_templates(is_active);

-- Добавлен DROP TRIGGER IF EXISTS перед созданием триггеров
DROP TRIGGER IF EXISTS update_evidence_types_updated_at ON evidence_types;
CREATE TRIGGER update_evidence_types_updated_at BEFORE UPDATE ON evidence_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_control_measure_templates_updated_at ON control_measure_templates;
CREATE TRIGGER update_control_measure_templates_updated_at BEFORE UPDATE ON control_measure_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed данных для типов доказательств
INSERT INTO evidence_types (code, title, description, file_format_regex, icon, sort_order) VALUES
  ('policy', 'Политика/Положение', 'Организационно-распорядительный документ', '\\.(pdf|docx?)$', 'FileText', 1),
  ('procedure', 'Процедура/Инструкция', 'Документ с описанием процедур', '\\.(pdf|docx?)$', 'FileCheck', 2),
  ('report', 'Отчет', 'Отчет о выполнении мероприятий', '\\.(pdf|docx?|xlsx?)$', 'FileBarChart', 3),
  ('certificate', 'Сертификат/Аттестат', 'Документ подтверждения соответствия', '\\.(pdf|jpg|png)$', 'Award', 4),
  ('log', 'Журнал/Лог', 'Журнал регистрации событий', '\\.(txt|log|csv|xlsx?)$', 'ScrollText', 5),
  ('screenshot', 'Скриншот', 'Снимок экрана системы', '\\.(jpg|png|gif)$', 'Image', 6),
  ('config', 'Конфигурация', 'Файл конфигурации системы', '\\.(conf|cfg|ini|json|xml|yaml)$', 'Settings', 7),
  ('contract', 'Договор', 'Договор с подрядчиком/поставщиком', '\\.(pdf|docx?)$', 'FileSignature', 8),
  ('other', 'Другое', 'Прочие типы доказательств', '.*', 'File', 99)
ON CONFLICT (code) DO NOTHING;
