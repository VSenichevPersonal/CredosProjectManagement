-- Control Framework System
-- Based on Drata Control Framework (DCF) concept

-- Control types enum
CREATE TYPE control_type AS ENUM ('preventive', 'detective', 'corrective');

-- Control frequency enum
CREATE TYPE control_frequency AS ENUM ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on_demand');

-- Controls table
CREATE TABLE IF NOT EXISTS controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Control identification
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  
  -- Control characteristics
  control_type control_type NOT NULL,
  frequency control_frequency NOT NULL,
  
  -- Ownership and status
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'deprecated')),
  
  -- Implementation details
  implementation_guide TEXT,
  testing_procedure TEXT,
  evidence_requirements TEXT[],
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT controls_tenant_code_unique UNIQUE (tenant_id, code)
);

-- Control mappings (связь контролей с требованиями)
CREATE TABLE IF NOT EXISTS control_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  
  -- Mapping type
  mapping_type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (mapping_type IN ('direct', 'indirect', 'partial')),
  
  -- Coverage percentage (for partial mappings)
  coverage_percentage INTEGER CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  
  -- Notes
  mapping_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT control_mappings_unique UNIQUE (control_id, requirement_id)
);

-- Control tests (результаты тестирования контролей)
CREATE TABLE IF NOT EXISTS control_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Test details
  test_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  test_result VARCHAR(20) NOT NULL CHECK (test_result IN ('passed', 'failed', 'partial', 'not_tested')),
  
  -- Findings
  findings TEXT,
  evidence_ids UUID[],
  
  -- Remediation
  remediation_required BOOLEAN DEFAULT false,
  remediation_plan TEXT,
  remediation_due_date DATE,
  remediation_completed_at TIMESTAMPTZ,
  
  -- Next test
  next_test_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_controls_tenant ON controls(tenant_id);
CREATE INDEX idx_controls_status ON controls(status);
CREATE INDEX idx_controls_owner ON controls(owner_id);
CREATE INDEX idx_controls_type ON controls(control_type);
CREATE INDEX idx_controls_frequency ON controls(frequency);

CREATE INDEX idx_control_mappings_tenant ON control_mappings(tenant_id);
CREATE INDEX idx_control_mappings_control ON control_mappings(control_id);
CREATE INDEX idx_control_mappings_requirement ON control_mappings(requirement_id);

CREATE INDEX idx_control_tests_tenant ON control_tests(tenant_id);
CREATE INDEX idx_control_tests_control ON control_tests(control_id);
CREATE INDEX idx_control_tests_organization ON control_tests(organization_id);
CREATE INDEX idx_control_tests_result ON control_tests(test_result);
CREATE INDEX idx_control_tests_date ON control_tests(test_date);

-- RLS policies
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_tests ENABLE ROW LEVEL SECURITY;

-- Seed data: Типовые контроли для российских требований
INSERT INTO controls (tenant_id, code, title, description, category, control_type, frequency, implementation_guide, evidence_requirements, status)
SELECT 
  t.id,
  'CTRL-001',
  'Категорирование объектов КИИ',
  'Проведение категорирования объектов критической информационной инфраструктуры в соответствии с 187-ФЗ',
  'КИИ',
  'preventive',
  'annual',
  'Провести анализ объектов, определить значимость, подать сведения в ФСТЭК',
  ARRAY['Акт категорирования', 'Сведения в ФСТЭК', 'Приказ о категорировании'],
  'active'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'CTRL-001');

INSERT INTO controls (tenant_id, code, title, description, category, control_type, frequency, implementation_guide, evidence_requirements, status)
SELECT 
  t.id,
  'CTRL-002',
  'Определение уровня защищенности ИСПДн',
  'Определение уровня защищенности информационной системы персональных данных',
  'ПДн',
  'preventive',
  'annual',
  'Провести классификацию ИСПДн, определить актуальные угрозы, установить уровень защищенности',
  ARRAY['Акт классификации', 'Модель угроз', 'Техническое задание на СЗИ'],
  'active'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'CTRL-002');

INSERT INTO controls (tenant_id, code, title, description, category, control_type, frequency, implementation_guide, evidence_requirements, status)
SELECT 
  t.id,
  'CTRL-003',
  'Мониторинг событий безопасности',
  'Непрерывный мониторинг событий информационной безопасности',
  'ГИС',
  'detective',
  'continuous',
  'Настроить SIEM-систему, определить события для мониторинга, настроить алерты',
  ARRAY['Журналы SIEM', 'Отчеты о событиях', 'Настройки мониторинга'],
  'active'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'CTRL-003');

INSERT INTO controls (tenant_id, code, title, description, category, control_type, frequency, implementation_guide, evidence_requirements, status)
SELECT 
  t.id,
  'CTRL-004',
  'Резервное копирование данных',
  'Регулярное резервное копирование критичных данных',
  'Общее',
  'preventive',
  'daily',
  'Настроить автоматическое резервное копирование, проверять целостность копий',
  ARRAY['Журналы резервного копирования', 'Отчеты о проверке восстановления'],
  'active'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'CTRL-004');

INSERT INTO controls (tenant_id, code, title, description, category, control_type, frequency, implementation_guide, evidence_requirements, status)
SELECT 
  t.id,
  'CTRL-005',
  'Обучение сотрудников по ИБ',
  'Регулярное обучение сотрудников основам информационной безопасности',
  'Общее',
  'preventive',
  'annual',
  'Провести обучение всех сотрудников, зафиксировать прохождение',
  ARRAY['Программа обучения', 'Журнал обучения', 'Сертификаты'],
  'active'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'CTRL-005');

INSERT INTO controls (tenant_id, code, title, description, category, control_type, frequency, implementation_guide, evidence_requirements, status)
SELECT 
  t.id,
  'CTRL-006',
  'Управление доступом',
  'Контроль и управление правами доступа пользователей к информационным системам',
  'Общее',
  'preventive',
  'monthly',
  'Регулярно проверять права доступа, отзывать неактуальные права',
  ARRAY['Матрица доступа', 'Журнал изменений прав', 'Отчеты о проверке'],
  'active'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM controls WHERE code = 'CTRL-006');

SELECT 'Control Framework created successfully' AS status;
