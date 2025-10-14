-- Обновление системы контролей (мер защиты)
-- Добавление недостающих колонок и таблиц

-- Добавляем колонку is_automated к существующей таблице controls
ALTER TABLE controls 
ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT false;

-- Создаем таблицу для реализации контролей в организациях
CREATE TABLE IF NOT EXISTS organization_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  
  -- Статус реализации
  implementation_status VARCHAR(50) NOT NULL DEFAULT 'not_implemented',
  -- not_implemented, in_progress, implemented, needs_review
  
  -- Детали реализации
  implementation_date DATE,
  implemented_by UUID REFERENCES users(id),
  implementation_notes TEXT,
  
  -- Эффективность
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  effectiveness_notes TEXT,
  last_tested_date DATE,
  next_test_date DATE,
  
  -- Ответственные
  owner_id UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, control_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_org_controls_org ON organization_controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_controls_control ON organization_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_org_controls_status ON organization_controls(implementation_status);
CREATE INDEX IF NOT EXISTS idx_org_controls_tenant ON organization_controls(tenant_id);

-- Комментарии
COMMENT ON TABLE organization_controls IS 'Реализация контролей (мер защиты) в организациях';
COMMENT ON COLUMN organization_controls.implementation_status IS 'Статус реализации: not_implemented, in_progress, implemented, needs_review';
COMMENT ON COLUMN organization_controls.effectiveness_rating IS 'Оценка эффективности от 1 до 5';

-- Вставляем начальные данные контролей только если их еще нет
INSERT INTO controls (
  tenant_id,
  code,
  title,
  description,
  category,
  control_type,
  frequency,
  status,
  is_automated,
  implementation_guide,
  testing_procedure
)
SELECT 
  (SELECT id FROM tenants LIMIT 1),
  'ORG-001',
  'Политика информационной безопасности',
  'Разработка и утверждение политики ИБ организации',
  'organizational',
  'preventive',
  'annual',
  'active',
  false,
  'Разработать политику ИБ в соответствии с требованиями 152-ФЗ и ФСТЭК',
  'Проверить наличие утвержденной политики, актуальность содержания'
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'ORG-001');

INSERT INTO controls (
  tenant_id,
  code,
  title,
  description,
  category,
  control_type,
  frequency,
  status,
  is_automated,
  implementation_guide,
  testing_procedure
)
SELECT 
  (SELECT id FROM tenants LIMIT 1),
  'TECH-001',
  'Антивирусная защита',
  'Установка и настройка средств антивирусной защиты',
  'technical',
  'preventive',
  'continuous',
  'active',
  true,
  'Установить сертифицированное антивирусное ПО на все рабочие станции и серверы',
  'Проверить наличие и актуальность антивирусных баз, статус защиты'
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'TECH-001');

INSERT INTO controls (
  tenant_id,
  code,
  title,
  description,
  category,
  control_type,
  frequency,
  status,
  is_automated,
  implementation_guide,
  testing_procedure
)
SELECT 
  (SELECT id FROM tenants LIMIT 1),
  'TECH-002',
  'Межсетевой экран',
  'Настройка и эксплуатация межсетевого экрана',
  'technical',
  'preventive',
  'continuous',
  'active',
  true,
  'Установить и настроить МЭ в соответствии с требованиями ФСТЭК',
  'Проверить правила фильтрации, логирование событий'
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'TECH-002');

INSERT INTO controls (
  tenant_id,
  code,
  title,
  description,
  category,
  control_type,
  frequency,
  status,
  is_automated,
  implementation_guide,
  testing_procedure
)
SELECT 
  (SELECT id FROM tenants LIMIT 1),
  'PHYS-001',
  'Контроль доступа в помещения',
  'Организация физического контроля доступа',
  'physical',
  'preventive',
  'continuous',
  'active',
  false,
  'Установить СКУД, организовать пропускной режим',
  'Проверить работу СКУД, журналы доступа'
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'PHYS-001');

SELECT 'Controls system updated successfully' as status;
