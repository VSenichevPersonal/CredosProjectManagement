-- Добавление tenant_id во все основные таблицы для multi-tenancy

-- 1. Добавить tenant_id в organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. Добавить tenant_id в users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Добавить tenant_id в requirements
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 4. Добавить tenant_id в compliance_records
ALTER TABLE compliance_records 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. Добавить tenant_id в regulatory_documents
ALTER TABLE regulatory_documents 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 6. Добавить tenant_id в audit_log (правильное название таблицы)
ALTER TABLE audit_log 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 7. Добавить tenant_id в notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Создать индексы для производительности
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_requirements_tenant_id ON requirements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_tenant_id ON compliance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_documents_tenant_id ON regulatory_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);

-- Привязать существующие данные к дефолтному tenant
UPDATE organizations SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE requirements SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE compliance_records SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE regulatory_documents SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE audit_log SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE notifications SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Сделать tenant_id обязательным (NOT NULL)
ALTER TABLE organizations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE requirements ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE compliance_records ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE regulatory_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE audit_log ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN tenant_id SET NOT NULL;

-- Проверка
SELECT 
  'organizations' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT tenant_id) as unique_tenants
FROM organizations
UNION ALL
SELECT 
  'users',
  COUNT(*),
  COUNT(DISTINCT tenant_id)
FROM users
UNION ALL
SELECT 
  'requirements',
  COUNT(*),
  COUNT(DISTINCT tenant_id)
FROM requirements
UNION ALL
SELECT 
  'compliance_records',
  COUNT(*),
  COUNT(DISTINCT tenant_id)
FROM compliance_records;
