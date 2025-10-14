-- =====================================================
-- IB COMPLIANCE PLATFORM - INITIAL DATABASE SCHEMA
-- =====================================================
-- Создание базы данных с правильным Supabase Auth
-- Включает: таблицы, триггеры, RLS политики, функции

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
  'super_admin',      -- Системный администратор
  'regulator_admin',  -- Администратор ФСТЭК
  'ministry_user',    -- Сотрудник министерства
  'institution_user', -- Сотрудник учреждения
  'ib_manager',       -- Руководитель ИБ
  'auditor'          -- Аудитор
);

-- Типы организаций
CREATE TYPE organization_type AS ENUM (
  'regulator',    -- Регулятор (ФСТЭК)
  'ministry',     -- Министерство
  'institution'   -- Учреждение
);

-- Статусы требований
CREATE TYPE requirement_status AS ENUM (
  'draft',      -- Черновик
  'active',     -- Активно
  'archived'    -- Архивировано
);

-- Уровни критичности
CREATE TYPE criticality_level AS ENUM (
  'critical',   -- Критический
  'high',       -- Высокий
  'medium',     -- Средний
  'low'         -- Низкий
);

-- Статусы соответствия
CREATE TYPE compliance_status AS ENUM (
  'compliant',      -- Соответствует
  'non_compliant',  -- Не соответствует
  'partial',        -- Частично соответствует
  'not_applicable', -- Не применимо
  'in_progress'     -- В процессе
);

-- =====================================================
-- 3. TABLES
-- =====================================================

-- Организации
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type organization_type NOT NULL,
  parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Пользователи (синхронизируется с auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Нормативные документы
CREATE TABLE regulatory_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Требования
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES regulatory_documents(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  criticality criticality_level NOT NULL DEFAULT 'medium',
  status requirement_status NOT NULL DEFAULT 'active',
  parent_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, code)
);

-- Записи о соответствии
CREATE TABLE compliance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status compliance_status NOT NULL DEFAULT 'in_progress',
  evidence TEXT,
  notes TEXT,
  assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assessed_at TIMESTAMPTZ,
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requirement_id, organization_id)
);

-- Аудит (immutable log)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Уведомления
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_organizations_parent ON organizations(parent_id);
CREATE INDEX idx_organizations_type ON organizations(type);

CREATE INDEX idx_requirements_document ON requirements(document_id);
CREATE INDEX idx_requirements_parent ON requirements(parent_id);
CREATE INDEX idx_requirements_status ON requirements(status);

CREATE INDEX idx_compliance_requirement ON compliance_records(requirement_id);
CREATE INDEX idx_compliance_organization ON compliance_records(organization_id);
CREATE INDEX idx_compliance_status ON compliance_records(status);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- =====================================================
-- 5. TRIGGERS FOR UPDATED_AT
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

CREATE TRIGGER update_regulatory_documents_updated_at BEFORE UPDATE ON regulatory_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON compliance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. SUPABASE AUTH INTEGRATION
-- =====================================================

-- Функция для автоматического создания записи в public.users
-- при регистрации пользователя в auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'institution_user'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на auth.users для автоматического создания public.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Включаем RLS на всех таблицах
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- USERS: Пользователи могут видеть себя и пользователей своей организации
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ORGANIZATIONS: Все аутентифицированные пользователи могут читать организации
CREATE POLICY "Authenticated users can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

-- REGULATORY_DOCUMENTS: Все аутентифицированные пользователи могут читать документы
CREATE POLICY "Authenticated users can view documents"
  ON regulatory_documents FOR SELECT
  TO authenticated
  USING (true);

-- REQUIREMENTS: Все аутентифицированные пользователи могут читать требования
CREATE POLICY "Authenticated users can view requirements"
  ON requirements FOR SELECT
  TO authenticated
  USING (true);

-- COMPLIANCE_RECORDS: Пользователи видят записи своей организации
CREATE POLICY "Users can view their organization compliance"
  ON compliance_records FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- AUDIT_LOG: Только super_admin может читать аудит
CREATE POLICY "Super admins can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- NOTIFICATIONS: Пользователи видят только свои уведомления
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Функция для получения роли текущего пользователя
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Функция для проверки, является ли пользователь super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- SCHEMA CREATED SUCCESSFULLY
-- =====================================================
