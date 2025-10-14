-- Создание справочника типов организаций
CREATE TABLE IF NOT EXISTS organization_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Название иконки из lucide-react
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_organization_types_code ON organization_types(code);
CREATE INDEX IF NOT EXISTS idx_organization_types_active ON organization_types(is_active);
CREATE INDEX IF NOT EXISTS idx_organization_types_sort ON organization_types(sort_order);

-- Начальные данные
INSERT INTO organization_types (code, name, description, icon, sort_order) VALUES
  ('ministry', 'Министерство', 'Федеральное министерство', 'Building2', 10),
  ('department', 'Департамент', 'Департамент или управление', 'Building', 20),
  ('agency', 'Агентство', 'Федеральное агентство', 'Briefcase', 30),
  ('service', 'Служба', 'Федеральная служба', 'Shield', 40),
  ('institution', 'Учреждение', 'Государственное учреждение', 'School', 50),
  ('enterprise', 'Предприятие', 'Государственное предприятие', 'Factory', 60),
  ('hospital', 'Медицинское учреждение', 'Больница, поликлиника', 'Hospital', 70),
  ('university', 'Образовательное учреждение', 'Университет, институт', 'GraduationCap', 80),
  ('company', 'Коммерческая организация', 'ООО, АО и другие', 'Building2', 90),
  ('other', 'Другое', 'Прочие типы организаций', 'HelpCircle', 100)
ON CONFLICT (code) DO NOTHING;

-- Комментарии
COMMENT ON TABLE organization_types IS 'Справочник типов организаций';
COMMENT ON COLUMN organization_types.code IS 'Уникальный код типа';
COMMENT ON COLUMN organization_types.name IS 'Название типа организации';
COMMENT ON COLUMN organization_types.icon IS 'Название иконки из lucide-react';
COMMENT ON COLUMN organization_types.sort_order IS 'Порядок сортировки';

-- Обновление таблицы organizations для связи с типами
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES organization_types(id);

-- Миграция существующих данных (если есть поле type как строка)
-- UPDATE organizations o
-- SET type_id = (SELECT id FROM organization_types WHERE code = o.type)
-- WHERE o.type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_type_id ON organizations(type_id);

SELECT 'Organization types dictionary created successfully' as status;
