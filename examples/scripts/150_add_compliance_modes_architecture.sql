-- =====================================================
-- COMPLIANCE MODES ARCHITECTURE
-- =====================================================
-- Добавление поддержки строгих и гибких режимов исполнения требований
-- Версия: 1.0
-- Дата: 2025-01-10

-- =====================================================
-- 1. НОВЫЕ ENUMS
-- =====================================================

-- Режимы исполнения
CREATE TYPE execution_mode AS ENUM ('strict', 'flexible');

-- =====================================================
-- 2. СПРАВОЧНИКИ
-- =====================================================

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

-- Шаблоны мер (рекомендуемые меры для требований)
CREATE TABLE IF NOT EXISTS control_measure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  implementation_guide TEXT,
  estimated_effort VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(requirement_id, code)
);

-- Конкретные меры для назначений требований
CREATE TABLE IF NOT EXISTS control_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  
  -- Связи
  compliance_record_id UUID NOT NULL REFERENCES compliance_records(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES control_measure_templates(id) ON DELETE SET NULL,
  
  -- Основная информация
  title VARCHAR(500) NOT NULL,
  description TEXT,
  implementation_notes TEXT,
  
  -- Статус и отслеживание
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  implementation_date DATE,
  responsible_user_id UUID REFERENCES users(id),
  
  -- Флаги для strict режима
  from_template BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- 3. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ТАБЛИЦ
-- =====================================================

-- Добавление полей в requirements для режимов
ALTER TABLE requirements 
  ADD COLUMN IF NOT EXISTS measure_mode execution_mode DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS evidence_type_mode execution_mode DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS allowed_evidence_type_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS suggested_control_measure_template_ids UUID[] DEFAULT '{}';

-- Добавление полей в compliance_records (RequirementAssignment)
ALTER TABLE compliance_records
  ADD COLUMN IF NOT EXISTS control_measure_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS evidence_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS next_due_date DATE,
  ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMPTZ;

-- Добавление связи с типом доказательства в evidence
ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS evidence_type_id UUID REFERENCES evidence_types(id) ON DELETE SET NULL;

-- =====================================================
-- 4. ИНДЕКСЫ
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_evidence_types_code ON evidence_types(code);
CREATE INDEX IF NOT EXISTS idx_evidence_types_active ON evidence_types(is_active);

CREATE INDEX IF NOT EXISTS idx_control_measure_templates_requirement ON control_measure_templates(requirement_id);
CREATE INDEX IF NOT EXISTS idx_control_measure_templates_active ON control_measure_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_control_measures_tenant ON control_measures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_control_measures_compliance_record ON control_measures(compliance_record_id);
CREATE INDEX IF NOT EXISTS idx_control_measures_requirement ON control_measures(requirement_id);
CREATE INDEX IF NOT EXISTS idx_control_measures_organization ON control_measures(organization_id);
CREATE INDEX IF NOT EXISTS idx_control_measures_template ON control_measures(template_id);
CREATE INDEX IF NOT EXISTS idx_control_measures_status ON control_measures(status);

CREATE INDEX IF NOT EXISTS idx_evidence_type_id ON evidence(evidence_type_id);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

CREATE TRIGGER update_evidence_types_updated_at BEFORE UPDATE ON evidence_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_control_measure_templates_updated_at BEFORE UPDATE ON control_measure_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_control_measures_updated_at BEFORE UPDATE ON control_measures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

ALTER TABLE evidence_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_measure_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_measures ENABLE ROW LEVEL SECURITY;

-- Evidence types - доступны всем аутентифицированным пользователям
CREATE POLICY "Authenticated users can view evidence types" ON evidence_types
  FOR SELECT TO authenticated USING (is_active = true);

-- Control measure templates - доступны всем аутентифицированным пользователям
CREATE POLICY "Authenticated users can view templates" ON control_measure_templates
  FOR SELECT TO authenticated USING (is_active = true);

-- Control measures - пользователи видят меры своей организации
CREATE POLICY "Users can view their organization measures" ON control_measures
  FOR SELECT TO authenticated USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert measures for their organization" ON control_measures
  FOR INSERT TO authenticated WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization measures" ON control_measures
  FOR UPDATE TO authenticated USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND (is_locked = false OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'ib_manager')
    ))
  );

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Функция для создания мер из шаблонов при назначении требования
CREATE OR REPLACE FUNCTION create_measures_from_templates(
  p_compliance_record_id UUID,
  p_requirement_id UUID,
  p_organization_id UUID,
  p_tenant_id UUID,
  p_created_by UUID
)
RETURNS void AS $$
DECLARE
  v_requirement RECORD;
  v_template RECORD;
  v_is_strict BOOLEAN;
BEGIN
  -- Получаем информацию о требовании
  SELECT measure_mode, suggested_control_measure_template_ids
  INTO v_requirement
  FROM requirements
  WHERE id = p_requirement_id;
  
  -- Проверяем режим
  v_is_strict := (v_requirement.measure_mode = 'strict');
  
  -- Создаем меры из шаблонов
  FOR v_template IN 
    SELECT * FROM control_measure_templates
    WHERE id = ANY(v_requirement.suggested_control_measure_template_ids)
    AND is_active = true
  LOOP
    INSERT INTO control_measures (
      tenant_id,
      compliance_record_id,
      requirement_id,
      organization_id,
      template_id,
      title,
      description,
      implementation_notes,
      from_template,
      is_locked,
      created_by
    ) VALUES (
      p_tenant_id,
      p_compliance_record_id,
      p_requirement_id,
      p_organization_id,
      v_template.id,
      v_template.title,
      v_template.description,
      v_template.implementation_guide,
      true,
      v_is_strict,
      p_created_by
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для валидации типа доказательства
CREATE OR REPLACE FUNCTION validate_evidence_type(
  p_requirement_id UUID,
  p_evidence_type_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_mode execution_mode;
  v_allowed_types UUID[];
BEGIN
  -- Получаем режим и допустимые типы
  SELECT evidence_type_mode, allowed_evidence_type_ids
  INTO v_mode, v_allowed_types
  FROM requirements
  WHERE id = p_requirement_id;
  
  -- В flexible режиме разрешены любые типы
  IF v_mode = 'flexible' THEN
    RETURN true;
  END IF;
  
  -- В strict режиме проверяем список
  RETURN p_evidence_type_id = ANY(v_allowed_types);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- MIGRATION COMPLETED
-- =====================================================
