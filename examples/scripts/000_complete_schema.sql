-- =====================================================
-- IB COMPLIANCE PLATFORM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Финальная версия схемы БД (консолидация всех миграций)
-- Версия: 1.0
-- Дата: 2025-01-07

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. ENUMS
-- =====================================================

-- Роли пользователей
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'regulator_admin',
  'ministry_user',
  'institution_user',
  'ib_manager',
  'auditor'
);

-- Типы организаций
CREATE TYPE organization_type AS ENUM (
  'regulator',
  'ministry',
  'institution'
);

-- Статусы требований
CREATE TYPE requirement_status AS ENUM (
  'draft',
  'active',
  'archived'
);

-- Уровни критичности
CREATE TYPE criticality_level AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

-- Статусы соответствия
CREATE TYPE compliance_status AS ENUM (
  'not_started',
  'in_progress',
  'compliant',
  'non_compliant',
  'partial',
  'not_applicable',
  'pending_review'
);

-- Статусы документов
CREATE TYPE document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'archived'
);

-- Статусы доказательств
CREATE TYPE evidence_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

-- =====================================================
-- 3. CORE TABLES
-- =====================================================

-- Tenants (мультитенантность)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Организации
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  name TEXT NOT NULL,
  short_name TEXT,
  type organization_type NOT NULL,
  parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 0,
  inn VARCHAR(12),
  ogrn VARCHAR(15),
  industry VARCHAR(100),
  address TEXT,
  contact_person_name VARCHAR(255),
  contact_person_email VARCHAR(255),
  contact_person_phone VARCHAR(50),
  employee_count INTEGER,
  has_pdn BOOLEAN DEFAULT false,
  has_kii BOOLEAN DEFAULT false,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Атрибуты организаций (для применимости)
CREATE TABLE IF NOT EXISTS organization_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  kii_category VARCHAR(50),
  pdn_level VARCHAR(50),
  is_financial BOOLEAN DEFAULT false,
  is_healthcare BOOLEAN DEFAULT false,
  is_government BOOLEAN DEFAULT false,
  employee_count INTEGER,
  has_foreign_data BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Типы организаций (справочник)
CREATE TABLE IF NOT EXISTS organization_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_type_id UUID REFERENCES organization_types(id),
  level INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Регуляторы (ФСТЭК, ФСБ и т.д.)
CREATE TABLE IF NOT EXISTS regulators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Нормативные базы
CREATE TABLE IF NOT EXISTS regulatory_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  short_name VARCHAR(200),
  description TEXT,
  effective_date DATE,
  category VARCHAR(50),
  authority VARCHAR(200),
  url TEXT,
  badge_text VARCHAR(50),
  badge_color VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Нормативные документы
CREATE TABLE IF NOT EXISTS regulatory_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  document_number TEXT NOT NULL UNIQUE,
  description TEXT,
  issued_by TEXT NOT NULL,
  issued_date DATE NOT NULL,
  effective_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочники
CREATE TABLE IF NOT EXISTS periodicities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  days_interval INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS responsible_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Требования
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  document_id UUID REFERENCES regulatory_documents(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  criticality criticality_level NOT NULL DEFAULT 'medium',
  status requirement_status NOT NULL DEFAULT 'active',
  parent_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  effective_date DATE,
  expiration_date DATE,
  regulator_id UUID REFERENCES regulators(id),
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id),
  periodicity_id UUID REFERENCES periodicities(id),
  verification_method_id UUID REFERENCES verification_methods(id),
  responsible_role_id UUID REFERENCES responsible_roles(id),
  document_status document_status DEFAULT 'draft',
  created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Записи о соответствии
CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status compliance_status NOT NULL DEFAULT 'not_started',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  comments TEXT,
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requirement_id, organization_id)
);

-- Контроли
CREATE TABLE IF NOT EXISTS controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  code VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  control_type VARCHAR(50) NOT NULL DEFAULT 'preventive',
  frequency VARCHAR(50) NOT NULL DEFAULT 'annual',
  is_automated BOOLEAN DEFAULT false,
  owner VARCHAR(255),
  owner_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  implementation_guide TEXT,
  testing_procedure TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(tenant_id, code)
);

-- Связь требований с контролями
CREATE TABLE IF NOT EXISTS requirement_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  mapping_type VARCHAR(50) NOT NULL DEFAULT 'direct',
  coverage_percentage INTEGER DEFAULT 100,
  mapping_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(requirement_id, control_id)
);

-- Реализация контролей в организациях
CREATE TABLE IF NOT EXISTS organization_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  implementation_status VARCHAR(50) NOT NULL DEFAULT 'not_implemented',
  implementation_date DATE,
  verification_date DATE,
  next_review_date DATE,
  responsible_user_id UUID,
  verifier_user_id UUID,
  implementation_notes TEXT,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(organization_id, control_id)
);

-- Доказательства
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  compliance_record_id UUID REFERENCES compliance_records(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  control_id UUID REFERENCES controls(id) ON DELETE SET NULL,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  storage_path TEXT,
  title VARCHAR(500),
  description TEXT,
  tags TEXT[],
  status evidence_status DEFAULT 'pending',
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь контролей с доказательствами
CREATE TABLE IF NOT EXISTS control_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Применимость требований
CREATE TABLE IF NOT EXISTS requirement_applicability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  requirement_id UUID NOT NULL UNIQUE REFERENCES requirements(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL DEFAULT 'automatic',
  filter_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS requirement_organization_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mapping_type VARCHAR(50) NOT NULL DEFAULT 'automatic',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(requirement_id, organization_id)
);

-- Уведомления
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- База знаний
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  file_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Аудит
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_requirements_tenant ON requirements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_requirements_document ON requirements(document_id);
CREATE INDEX IF NOT EXISTS idx_requirements_parent ON requirements(parent_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_regulatory_framework ON requirements(regulatory_framework_id);

CREATE INDEX IF NOT EXISTS idx_compliance_tenant ON compliance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requirement ON compliance_records(requirement_id);
CREATE INDEX IF NOT EXISTS idx_compliance_organization ON compliance_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_records(status);

CREATE INDEX IF NOT EXISTS idx_controls_tenant ON controls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_controls_type ON controls(control_type);
CREATE INDEX IF NOT EXISTS idx_controls_status ON controls(status);

CREATE INDEX IF NOT EXISTS idx_requirement_controls_requirement ON requirement_controls(requirement_id);
CREATE INDEX IF NOT EXISTS idx_requirement_controls_control ON requirement_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_requirement_controls_tenant ON requirement_controls(tenant_id);

CREATE INDEX IF NOT EXISTS idx_org_controls_organization ON organization_controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_controls_control ON organization_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_org_controls_status ON organization_controls(implementation_status);
CREATE INDEX IF NOT EXISTS idx_org_controls_tenant ON organization_controls(tenant_id);

CREATE INDEX IF NOT EXISTS idx_evidence_tenant ON evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_compliance ON evidence(compliance_record_id);
CREATE INDEX IF NOT EXISTS idx_evidence_requirement ON evidence(requirement_id);
CREATE INDEX IF NOT EXISTS idx_evidence_control ON evidence(control_id);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON compliance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_controls_updated_at BEFORE UPDATE ON controls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_controls_updated_at BEFORE UPDATE ON organization_controls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Supabase Auth Integration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'institution_user'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view themselves" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- Organizations policies
CREATE POLICY "Authenticated users can view organizations" ON organizations
  FOR SELECT TO authenticated USING (true);

-- Requirements policies
CREATE POLICY "Authenticated users can view requirements" ON requirements
  FOR SELECT TO authenticated USING (true);

-- Compliance policies
CREATE POLICY "Users can view their organization compliance" ON compliance_records
  FOR SELECT TO authenticated USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_organization_hierarchy(root_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type organization_type,
  parent_id UUID,
  level INTEGER
) AS $$
  WITH RECURSIVE org_tree AS (
    SELECT o.id, o.name, o.type, o.parent_id, o.level
    FROM organizations o
    WHERE o.id = root_id
    
    UNION ALL
    
    SELECT o.id, o.name, o.type, o.parent_id, o.level
    FROM organizations o
    INNER JOIN org_tree ot ON o.parent_id = ot.id
  )
  SELECT * FROM org_tree ORDER BY level;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- SCHEMA CREATED SUCCESSFULLY
-- =====================================================
