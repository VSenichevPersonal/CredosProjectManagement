-- Создание таблицы tenants для multi-tenancy архитектуры
-- Каждый tenant - это независимая вертикаль (например, правительство региона)

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- "Правительство Московской области"
  slug VARCHAR(100) UNIQUE NOT NULL, -- "moscow-region"
  description TEXT,
  settings JSONB DEFAULT '{}', -- Настройки tenant (брендинг, лимиты и т.д.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- RLS политики для tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Super admin может видеть все tenants
CREATE POLICY "super_admin_can_view_all_tenants" ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Пользователи могут видеть только свой tenant
CREATE POLICY "users_can_view_own_tenant" ON tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Создать дефолтный tenant для существующих данных
INSERT INTO tenants (id, name, slug, description, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ФСТЭК России',
  'fstek-russia',
  'Федеральная служба по техническому и экспортному контролю',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Проверка
SELECT 
  id,
  name,
  slug,
  is_active,
  created_at
FROM tenants;
