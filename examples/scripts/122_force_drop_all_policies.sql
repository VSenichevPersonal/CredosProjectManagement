-- Полное удаление всех RLS политик и отключение RLS

-- Удаляем все политики для users
DROP POLICY IF EXISTS "users_tenant_isolation" ON users;
DROP POLICY IF EXISTS "users_can_view_own_tenant" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- Удаляем все политики для organizations
DROP POLICY IF EXISTS "organizations_tenant_isolation" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;

-- Удаляем все политики для requirements
DROP POLICY IF EXISTS "requirements_tenant_isolation" ON requirements;
DROP POLICY IF EXISTS "requirements_insert_policy" ON requirements;
DROP POLICY IF EXISTS "requirements_update_policy" ON requirements;
DROP POLICY IF EXISTS "requirements_delete_policy" ON requirements;
DROP POLICY IF EXISTS "requirements_select_policy" ON requirements;

-- Удаляем все политики для compliance_records
DROP POLICY IF EXISTS "compliance_tenant_isolation" ON compliance_records;
DROP POLICY IF EXISTS "compliance_insert_policy" ON compliance_records;
DROP POLICY IF EXISTS "compliance_update_policy" ON compliance_records;
DROP POLICY IF EXISTS "compliance_delete_policy" ON compliance_records;
DROP POLICY IF EXISTS "compliance_select_policy" ON compliance_records;

-- Удаляем все политики для regulatory_documents
DROP POLICY IF EXISTS "documents_tenant_isolation" ON regulatory_documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON regulatory_documents;
DROP POLICY IF EXISTS "documents_update_policy" ON regulatory_documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON regulatory_documents;
DROP POLICY IF EXISTS "documents_select_policy" ON regulatory_documents;

-- Удаляем все политики для tenants
DROP POLICY IF EXISTS "tenants_select_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_update_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_delete_policy" ON tenants;

-- Удаляем все политики для audit_log
DROP POLICY IF EXISTS "audit_tenant_isolation" ON audit_log;
DROP POLICY IF EXISTS "audit_insert_policy" ON audit_log;
DROP POLICY IF EXISTS "audit_select_policy" ON audit_log;

-- Удаляем все политики для notifications
DROP POLICY IF EXISTS "notifications_tenant_isolation" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;

-- ОТКЛЮЧАЕМ RLS для всех таблиц
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Проверяем результат
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
