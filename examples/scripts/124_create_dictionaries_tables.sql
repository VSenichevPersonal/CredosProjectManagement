-- Create dictionary tables for managing reference data

-- Regulators (Регуляторы)
CREATE TABLE IF NOT EXISTS regulators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories (Категории требований)
CREATE TABLE IF NOT EXISTS requirement_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Periodicities (Периодичности)
CREATE TABLE IF NOT EXISTS periodicities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification Methods (Способы подтверждения)
CREATE TABLE IF NOT EXISTS verification_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responsible Roles (Ответственные роли)
CREATE TABLE IF NOT EXISTS responsible_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default data for ФСТЭК tenant
INSERT INTO regulators (tenant_id, name, short_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Федеральная служба по техническому и экспортному контролю', 'ФСТЭК'),
  ('00000000-0000-0000-0000-000000000001', 'Федеральная служба безопасности', 'ФСБ'),
  ('00000000-0000-0000-0000-000000000001', 'Федеральная служба по надзору в сфере связи', 'Роскомнадзор'),
  ('00000000-0000-0000-0000-000000000001', 'Министерство цифрового развития', 'Минцифры');

INSERT INTO requirement_categories (tenant_id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Критическая информационная инфраструктура', 'КИИ'),
  ('00000000-0000-0000-0000-000000000001', 'Персональные данные', 'ПДн'),
  ('00000000-0000-0000-0000-000000000001', 'Государственные информационные системы', 'ГИС'),
  ('00000000-0000-0000-0000-000000000001', 'Криптографическая защита информации', 'Криптография'),
  ('00000000-0000-0000-0000-000000000001', 'Общие требования', 'Общее');

INSERT INTO periodicities (tenant_id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Однократно', 'once'),
  ('00000000-0000-0000-0000-000000000001', 'Ежегодно', 'annual'),
  ('00000000-0000-0000-0000-000000000001', 'Ежеквартально', 'quarterly'),
  ('00000000-0000-0000-0000-000000000001', 'Ежемесячно', 'monthly'),
  ('00000000-0000-0000-0000-000000000001', 'Постоянно', 'continuous');

INSERT INTO verification_methods (tenant_id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Документ', 'document'),
  ('00000000-0000-0000-0000-000000000001', 'Скриншот', 'screenshot'),
  ('00000000-0000-0000-0000-000000000001', 'Сертификат', 'certificate'),
  ('00000000-0000-0000-0000-000000000001', 'Метрика', 'metric'),
  ('00000000-0000-0000-0000-000000000001', 'Аудит', 'audit');

INSERT INTO responsible_roles (tenant_id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Руководитель службы ИБ (CISO)', 'ciso'),
  ('00000000-0000-0000-0000-000000000001', 'Администратор информационной безопасности', 'ib_admin'),
  ('00000000-0000-0000-0000-000000000001', 'Системный администратор', 'sysadmin'),
  ('00000000-0000-0000-0000-000000000001', 'Руководитель организации', 'director'),
  ('00000000-0000-0000-0000-000000000001', 'Специалист по защите информации', 'security_specialist');

SELECT 'Dictionary tables created and populated' AS status;
