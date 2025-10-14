# Database Schema - Stage 13

Полная схема базы данных системы IB Compliance Platform.

## Обзор

База данных построена на PostgreSQL (Supabase) с использованием:
- **Row Level Security (RLS)** для изоляции данных
- **Triggers** для автоматизации
- **Functions** для сложной логики
- **Indexes** для производительности

## Core Tables

### tenants

Тенанты системы (мультитенантность).

\`\`\`sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  root_organization_id UUID, -- Корневая организация тенанта
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Indexes**:
- `idx_tenants_slug` ON slug
- `idx_tenants_is_active` ON is_active

### users

Пользователи системы.

\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Roles**:
- `super_admin` - Суперадминистратор
- `regulator_admin` - Администратор регулятора
- `ministry_user` - Пользователь министерства
- `institution_user` - Пользователь учреждения
- `ciso` - CISO
- `auditor` - Аудитор

**Indexes**:
- `idx_users_email` ON email
- `idx_users_organization_id` ON organization_id
- `idx_users_tenant_id` ON tenant_id
- `idx_users_role` ON role

### organizations

Организации (иерархическая структура).

\`\`\`sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type_id UUID REFERENCES organization_types(id),
  parent_id UUID REFERENCES organizations(id),
  level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Реквизиты
  inn VARCHAR(12),
  ogrn VARCHAR(15),
  industry VARCHAR(255),
  
  -- Контакты
  address TEXT,
  contact_person_name VARCHAR(255),
  contact_person_email VARCHAR(255),
  contact_person_phone VARCHAR(50),
  
  -- Атрибуты
  employee_count INTEGER,
  has_pdn BOOLEAN DEFAULT false,
  has_kii BOOLEAN DEFAULT false,
  description TEXT,
  
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Indexes**:
- `idx_organizations_tenant_id` ON tenant_id
- `idx_organizations_parent_id` ON parent_id
- `idx_organizations_type_id` ON type_id
- `idx_organizations_inn` ON inn

### organization_types

Типы организаций.

\`\`\`sql
CREATE TABLE organization_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## Requirements Tables

### regulatory_frameworks

Нормативные базы.

\`\`\`sql
CREATE TABLE regulatory_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  description TEXT,
  effective_date DATE,
  category VARCHAR(100),
  authority VARCHAR(255),
  badge_text VARCHAR(50),
  badge_color VARCHAR(20),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### requirements

Требования.

\`\`\`sql
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  
  category_id UUID REFERENCES requirement_categories(id),
  criticality VARCHAR(20),
  
  document_id UUID REFERENCES documents(id),
  parent_id UUID REFERENCES requirements(id),
  
  effective_date DATE,
  expiration_date DATE,
  
  regulator_id UUID REFERENCES regulators(id),
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id),
  
  periodicity_id UUID REFERENCES periodicities(id),
  verification_method_id UUID REFERENCES verification_methods(id),
  responsible_role_id UUID REFERENCES responsible_roles(id),
  document_status VARCHAR(20),
  
  -- Режимы исполнения
  measure_mode VARCHAR(20) DEFAULT 'flexible',
  evidence_type_mode VARCHAR(20) DEFAULT 'flexible',
  allowed_evidence_type_ids UUID[],
  suggested_control_measure_template_ids UUID[],
  
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(code, tenant_id)
);
\`\`\`

**Indexes**:
- `idx_requirements_tenant_id` ON tenant_id
- `idx_requirements_code` ON code
- `idx_requirements_category_id` ON category_id
- `idx_requirements_framework_id` ON regulatory_framework_id
- `idx_requirements_status` ON status

### requirement_legal_references

Связь требований со статьями законов (many-to-many).

\`\`\`sql
CREATE TABLE requirement_legal_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  legal_article_id UUID REFERENCES legal_articles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(requirement_id, legal_article_id)
);
\`\`\`

### legal_articles

Статьи законов.

\`\`\`sql
CREATE TABLE legal_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_reference VARCHAR(500) NOT NULL,
  title TEXT,
  content TEXT,
  article_number VARCHAR(50),
  part VARCHAR(50),
  paragraph VARCHAR(50),
  clause VARCHAR(50),
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(full_reference, tenant_id)
);
\`\`\`

## Compliance Tables

### compliance_records

Записи комплаенса (исполнение требований).

\`\`\`sql
CREATE TABLE compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES requirements(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  
  assigned_to UUID REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  comments TEXT,
  next_review_date DATE,
  
  control_measure_ids UUID[],
  evidence_ids UUID[],
  next_due_date DATE,
  last_confirmed_at TIMESTAMP WITH TIME ZONE,
  
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(requirement_id, organization_id, tenant_id)
);
\`\`\`

**Status values**:
- `pending` - Ожидает исполнения
- `in_progress` - В процессе
- `compliant` - Исполнено
- `non_compliant` - Не исполнено
- `partial` - Частично исполнено
- `not_applicable` - Не применимо

**Indexes**:
- `idx_compliance_tenant_id` ON tenant_id
- `idx_compliance_requirement_id` ON requirement_id
- `idx_compliance_organization_id` ON organization_id
- `idx_compliance_status` ON status
- `idx_compliance_org_req` ON (organization_id, requirement_id)

### applicability_rules

Правила применимости требований.

\`\`\`sql
CREATE TABLE applicability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES requirements(id) UNIQUE,
  rule_type VARCHAR(20) DEFAULT 'all',
  conditions JSONB DEFAULT '{}',
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Rule types**:
- `all` - Применимо ко всем
- `conditional` - Условное применение
- `manual` - Ручное назначение

**Conditions format**:
\`\`\`json
{
  "kiiCategory": [1, 2],
  "pdnLevel": [1, 2, 3],
  "isFinancial": true,
  "organizationTypes": ["uuid1", "uuid2"]
}
\`\`\`

### applicability_mappings

Ручные назначения применимости.

\`\`\`sql
CREATE TABLE applicability_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES requirements(id),
  organization_id UUID REFERENCES organizations(id),
  is_applicable BOOLEAN NOT NULL,
  reason TEXT,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(requirement_id, organization_id)
);
\`\`\`

## Evidence & Controls Tables

### evidence

Доказательства исполнения.

\`\`\`sql
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_id UUID REFERENCES compliance_records(id),
  control_id UUID REFERENCES organization_controls(id),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  
  status VARCHAR(20) DEFAULT 'pending',
  description TEXT,
  
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Status values**:
- `pending` - Ожидает проверки
- `approved` - Одобрено
- `rejected` - Отклонено

**Indexes**:
- `idx_evidence_tenant_id` ON tenant_id
- `idx_evidence_compliance_id` ON compliance_id
- `idx_evidence_control_id` ON control_id
- `idx_evidence_organization_id` ON organization_id

### evidence_types

Типы доказательств (справочник).

\`\`\`sql
CREATE TABLE evidence_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### organization_controls

Меры контроля организаций.

\`\`\`sql
CREATE TABLE organization_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  requirement_id UUID REFERENCES requirements(id),
  template_id UUID REFERENCES control_measure_templates(id),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  implementation_guide TEXT,
  
  status VARCHAR(20) DEFAULT 'planned',
  control_type VARCHAR(50),
  frequency VARCHAR(50),
  
  responsible_user_id UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Status values**:
- `planned` - Запланировано
- `in_progress` - В процессе
- `implemented` - Внедрено
- `verified` - Проверено

### control_measure_templates

Шаблоны мер контроля (справочник).

\`\`\`sql
CREATE TABLE control_measure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  implementation_guide TEXT,
  category VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## Documents Tables

### documents

Документы.

\`\`\`sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(100),
  
  file_name VARCHAR(255),
  file_url TEXT,
  file_size BIGINT,
  
  current_version_id UUID,
  version_number INTEGER DEFAULT 1,
  
  status VARCHAR(20) DEFAULT 'draft',
  is_actual BOOLEAN DEFAULT true,
  actuality_checked_at TIMESTAMP WITH TIME ZONE,
  actuality_checked_by UUID REFERENCES users(id),
  
  uploaded_by UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### document_versions

Версии документов.

\`\`\`sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  
  changes_description TEXT,
  uploaded_by UUID REFERENCES users(id),
  
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(document_id, version_number)
);
\`\`\`

### document_analyses

Анализы документов через AI.

\`\`\`sql
CREATE TABLE document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES document_versions(id),
  
  analysis_type VARCHAR(50),
  result JSONB,
  
  analyzed_by UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## Audit & Notifications Tables

### audit_log

Журнал аудита (immutable).

\`\`\`sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Indexes**:
- `idx_audit_log_user_id` ON user_id
- `idx_audit_log_resource` ON (resource_type, resource_id)
- `idx_audit_log_created_at` ON created_at
- `idx_audit_log_tenant_id` ON tenant_id

### notifications

Уведомления пользователей.

\`\`\`sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**Indexes**:
- `idx_notifications_user_id` ON user_id
- `idx_notifications_is_read` ON is_read
- `idx_notifications_created_at` ON created_at

## Functions

### get_subordinate_organizations

Получить все подведомственные организации.

\`\`\`sql
CREATE OR REPLACE FUNCTION get_subordinate_organizations(org_id UUID)
RETURNS TABLE (id UUID, name VARCHAR, level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subordinates AS (
    SELECT o.id, o.name, o.level, o.parent_id
    FROM organizations o
    WHERE o.id = org_id
    
    UNION ALL
    
    SELECT o.id, o.name, o.level, o.parent_id
    FROM organizations o
    INNER JOIN subordinates s ON o.parent_id = s.id
  )
  SELECT s.id, s.name, s.level
  FROM subordinates s;
END;
$$ LANGUAGE plpgsql;
\`\`\`

## Triggers

### update_updated_at

Автоматическое обновление поля `updated_at`.

\`\`\`sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_requirements_updated_at
  BEFORE UPDATE ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
\`\`\`

## RLS Policies

### Tenant Isolation

Все таблицы имеют политику изоляции по tenant_id:

\`\`\`sql
CREATE POLICY "tenant_isolation" ON requirements
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
\`\`\`

### Organization Hierarchy

Доступ к данным организаций с учетом иерархии:

\`\`\`sql
CREATE POLICY "org_hierarchy_access" ON compliance_records
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM get_subordinate_organizations(
        (SELECT organization_id FROM users WHERE id = auth.uid())
      )
    )
  );
\`\`\`

## Migrations

Все миграции находятся в папке `scripts/` и нумеруются последовательно:
- `000_complete_schema.sql` - Полная схема
- `001_seed_data.sql` - Начальные данные
- `002_seed_tula_region.sql` - Данные Тульской области
- и т.д.

## Backup & Recovery

В разработке.
