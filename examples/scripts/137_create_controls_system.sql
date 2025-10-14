-- Обновление системы контролей для соответствия существующим типам

-- Проверка существования таблицы controls
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'controls') THEN
    -- Создание таблицы controls если не существует
    CREATE TABLE controls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
      
      -- Основная информация
      code VARCHAR(50) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      
      -- Тип контроля (preventive, detective, corrective)
      control_type VARCHAR(50) NOT NULL DEFAULT 'preventive',
      
      -- Частота проверки
      frequency VARCHAR(50) NOT NULL DEFAULT 'annual',
      
      -- Автоматизация
      is_automated BOOLEAN DEFAULT false,
      
      -- Ответственный
      owner VARCHAR(255),
      owner_id UUID,
      
      -- Статус
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      
      -- Руководства
      implementation_guide TEXT,
      testing_procedure TEXT,
      
      -- Метаданные
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID,
      updated_by UUID,
      
      UNIQUE(tenant_id, code)
    );
    
    CREATE INDEX idx_controls_tenant ON controls(tenant_id);
    CREATE INDEX idx_controls_type ON controls(control_type);
    CREATE INDEX idx_controls_status ON controls(status);
  END IF;
END $$;

-- Создание таблицы связи контролей с требованиями
CREATE TABLE IF NOT EXISTS requirement_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  
  -- Тип маппинга
  mapping_type VARCHAR(50) NOT NULL DEFAULT 'direct', -- direct, indirect, partial
  coverage_percentage INTEGER DEFAULT 100,
  mapping_notes TEXT,
  
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(requirement_id, control_id)
);

-- Создание таблицы реализации контролей в организациях
CREATE TABLE IF NOT EXISTS organization_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  
  -- Статус реализации
  implementation_status VARCHAR(50) NOT NULL DEFAULT 'not_implemented',
  -- not_implemented, in_progress, implemented, verified, non_applicable
  
  -- Даты
  implementation_date DATE,
  verification_date DATE,
  next_review_date DATE,
  
  -- Ответственные
  responsible_user_id UUID,
  verifier_user_id UUID,
  
  -- Заметки
  implementation_notes TEXT,
  verification_notes TEXT,
  
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(organization_id, control_id)
);

-- Создание таблицы тестирования контролей
CREATE TABLE IF NOT EXISTS control_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Детали теста
  test_date DATE NOT NULL,
  tested_by UUID,
  test_result VARCHAR(50) NOT NULL, -- passed, failed, partial, not_tested
  
  -- Находки
  findings TEXT,
  
  -- Исправление
  remediation_required BOOLEAN DEFAULT false,
  remediation_plan TEXT,
  remediation_due_date DATE,
  remediation_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Следующий тест
  next_test_date DATE,
  
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_requirement_controls_requirement ON requirement_controls(requirement_id);
CREATE INDEX IF NOT EXISTS idx_requirement_controls_control ON requirement_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_requirement_controls_tenant ON requirement_controls(tenant_id);

CREATE INDEX IF NOT EXISTS idx_org_controls_organization ON organization_controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_controls_control ON organization_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_org_controls_status ON organization_controls(implementation_status);
CREATE INDEX IF NOT EXISTS idx_org_controls_responsible ON organization_controls(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_org_controls_tenant ON organization_controls(tenant_id);

CREATE INDEX IF NOT EXISTS idx_control_tests_control ON control_tests(control_id);
CREATE INDEX IF NOT EXISTS idx_control_tests_organization ON control_tests(organization_id);
CREATE INDEX IF NOT EXISTS idx_control_tests_result ON control_tests(test_result);
CREATE INDEX IF NOT EXISTS idx_control_tests_tenant ON control_tests(tenant_id);

-- Комментарии
COMMENT ON TABLE requirement_controls IS 'Связь требований с контролями (маппинг)';
COMMENT ON TABLE organization_controls IS 'Реализация контролей в организациях';
COMMENT ON TABLE control_tests IS 'История тестирования контролей';

COMMENT ON COLUMN requirement_controls.mapping_type IS 'Тип маппинга: direct (прямой), indirect (косвенный), partial (частичный)';
COMMENT ON COLUMN organization_controls.implementation_status IS 'Статус: not_implemented, in_progress, implemented, verified, non_applicable';
COMMENT ON COLUMN control_tests.test_result IS 'Результат: passed, failed, partial, not_tested';

-- Начальные данные: типовые контроли для российского ИБ
INSERT INTO controls (tenant_id, code, title, description, category, control_type, frequency, is_automated) VALUES
-- Превентивные организационные контроли
('00000000-0000-0000-0000-000000000000', 'ORG-001', 'Политика информационной безопасности', 'Разработка и утверждение политики ИБ организации', 'Организационные', 'preventive', 'annual', false),
('00000000-0000-0000-0000-000000000000', 'ORG-002', 'Назначение ответственного за ИБ', 'Приказ о назначении ответственного за обеспечение ИБ', 'Организационные', 'preventive', 'annual', false),
('00000000-0000-0000-0000-000000000000', 'ORG-003', 'Инструкция пользователей ИС', 'Инструкция по работе пользователей с информационными системами', 'Организационные', 'preventive', 'annual', false),
('00000000-0000-0000-0000-000000000000', 'ORG-004', 'Обучение персонала по ИБ', 'Проведение обучения и инструктажа персонала по вопросам ИБ', 'Организационные', 'preventive', 'quarterly', false),

-- Детективные организационные контроли
('00000000-0000-0000-0000-000000000000', 'ORG-005', 'Аудит информационной безопасности', 'Проведение регулярных аудитов ИБ', 'Организационные', 'detective', 'annual', false),

-- Превентивные технические контроли
('00000000-0000-0000-0000-000000000000', 'TECH-001', 'Антивирусная защита', 'Установка и обновление антивирусного ПО на всех рабочих станциях и серверах', 'Технические', 'preventive', 'continuous', true),
('00000000-0000-0000-0000-000000000000', 'TECH-002', 'Межсетевой экран', 'Установка и настройка межсетевого экрана для защиты периметра сети', 'Технические', 'preventive', 'continuous', true),
('00000000-0000-0000-0000-000000000000', 'TECH-004', 'Резервное копирование', 'Регулярное резервное копирование критичных данных', 'Технические', 'preventive', 'daily', true),
('00000000-0000-0000-0000-000000000000', 'TECH-005', 'Шифрование данных', 'Использование СКЗИ для шифрования конфиденциальных данных', 'Технические', 'preventive', 'continuous', true),
('00000000-0000-0000-0000-000000000000', 'TECH-006', 'Управление доступом', 'Система управления учетными записями и правами доступа', 'Технические', 'preventive', 'continuous', true),
('00000000-0000-0000-0000-000000000000', 'TECH-008', 'Обновление ПО', 'Своевременная установка обновлений безопасности', 'Технические', 'preventive', 'weekly', true),

-- Детективные технические контроли
('00000000-0000-0000-0000-000000000000', 'TECH-003', 'Система обнаружения вторжений', 'Внедрение СОВ для мониторинга сетевой активности', 'Технические', 'detective', 'continuous', true),
('00000000-0000-0000-0000-000000000000', 'TECH-007', 'Журналирование событий', 'Регистрация событий безопасности в информационных системах', 'Технические', 'detective', 'continuous', true),

-- Превентивные физические контроли
('00000000-0000-0000-0000-000000000000', 'PHYS-001', 'Контроль доступа в помещения', 'СКУД для контроля доступа в помещения с ИТ-инфраструктурой', 'Физические', 'preventive', 'continuous', true),
('00000000-0000-0000-0000-000000000000', 'PHYS-003', 'Охрана объекта', 'Физическая охрана объекта информатизации', 'Физические', 'preventive', 'continuous', false),
('00000000-0000-0000-0000-000000000000', 'PHYS-004', 'Защита от пожара', 'Система пожаротушения и пожарной сигнализации', 'Физические', 'preventive', 'continuous', true),

-- Детективные физические контроли
('00000000-0000-0000-0000-000000000000', 'PHYS-002', 'Видеонаблюдение', 'Система видеонаблюдения в критичных зонах', 'Физические', 'detective', 'continuous', true)

ON CONFLICT (tenant_id, code) DO NOTHING;

SELECT 'Controls system created successfully' as status;
