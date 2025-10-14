-- Удаление всех RLS политик для исправления бесконечной рекурсии

-- Drop policies for tenants
DROP POLICY IF EXISTS "super_admin_can_view_all_tenants" ON tenants;
DROP POLICY IF EXISTS "users_can_view_own_tenant" ON tenants;

-- Drop policies for organizations
DROP POLICY IF EXISTS "users_can_view_organizations_in_tenant" ON organizations;
DROP POLICY IF EXISTS "admins_can_manage_organizations_in_tenant" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations in their hierarchy" ON organizations;
DROP POLICY IF EXISTS "Users can manage organizations in their hierarchy" ON organizations;

-- Drop policies for requirements
DROP POLICY IF EXISTS "users_can_view_requirements_in_tenant" ON requirements;
DROP POLICY IF EXISTS "admins_can_manage_requirements_in_tenant" ON requirements;
DROP POLICY IF EXISTS "Users can view requirements" ON requirements;
DROP POLICY IF EXISTS "Admins can manage requirements" ON requirements;

-- Drop policies for compliance_records
DROP POLICY IF EXISTS "users_can_view_compliance_in_tenant" ON compliance_records;
DROP POLICY IF EXISTS "users_can_manage_compliance_in_tenant" ON compliance_records;
DROP POLICY IF EXISTS "Users can view compliance records" ON compliance_records;
DROP POLICY IF EXISTS "Users can manage compliance records" ON compliance_records;

-- Drop policies for regulatory_documents
DROP POLICY IF EXISTS "users_can_view_documents_in_tenant" ON regulatory_documents;
DROP POLICY IF EXISTS "admins_can_manage_documents_in_tenant" ON regulatory_documents;
DROP POLICY IF EXISTS "Users can view documents" ON regulatory_documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON regulatory_documents;

-- Drop policies for users
DROP POLICY IF EXISTS "users_can_view_users_in_tenant" ON users;
DROP POLICY IF EXISTS "admins_can_manage_users_in_tenant" ON users;
DROP POLICY IF EXISTS "Users can view other users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Временно отключить RLS для всех таблиц
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

SELECT 'All RLS policies dropped and RLS disabled' as status;
