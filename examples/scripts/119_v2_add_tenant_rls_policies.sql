-- RLS политики для multi-tenancy изоляции данных
-- Выполнять ПОСЛЕ добавления tenant_id во все таблицы

-- ============================================
-- TENANTS TABLE RLS
-- ============================================

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

-- ============================================
-- ORGANIZATIONS TABLE RLS
-- ============================================

-- Обновить существующие политики для учета tenant_id
DROP POLICY IF EXISTS "Users can view organizations in their hierarchy" ON organizations;
DROP POLICY IF EXISTS "Users can manage organizations in their hierarchy" ON organizations;

CREATE POLICY "users_can_view_organizations_in_tenant" ON organizations
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE users.id = auth.uid()
    )
  );

-- Заменил ministry_admin на regulator_admin (правильная роль)
CREATE POLICY "admins_can_manage_organizations_in_tenant" ON organizations
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'regulator_admin')
    )
  );

-- ============================================
-- REQUIREMENTS TABLE RLS
-- ============================================

DROP POLICY IF EXISTS "Users can view requirements" ON requirements;
DROP POLICY IF EXISTS "Admins can manage requirements" ON requirements;

CREATE POLICY "users_can_view_requirements_in_tenant" ON requirements
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "admins_can_manage_requirements_in_tenant" ON requirements
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'regulator_admin')
    )
  );

-- ============================================
-- COMPLIANCE_RECORDS TABLE RLS
-- ============================================

DROP POLICY IF EXISTS "Users can view compliance records" ON compliance_records;
DROP POLICY IF EXISTS "Users can manage compliance records" ON compliance_records;

CREATE POLICY "users_can_view_compliance_in_tenant" ON compliance_records
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "users_can_manage_compliance_in_tenant" ON compliance_records
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE users.id = auth.uid()
    )
  );

-- ============================================
-- REGULATORY_DOCUMENTS TABLE RLS
-- ============================================

DROP POLICY IF EXISTS "Users can view documents" ON regulatory_documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON regulatory_documents;

CREATE POLICY "users_can_view_documents_in_tenant" ON regulatory_documents
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "admins_can_manage_documents_in_tenant" ON regulatory_documents
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'regulator_admin')
    )
  );

-- ============================================
-- USERS TABLE RLS
-- ============================================

DROP POLICY IF EXISTS "Users can view other users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

CREATE POLICY "users_can_view_users_in_tenant" ON users
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "admins_can_manage_users_in_tenant" ON users
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'regulator_admin')
    )
  );

-- Проверка политик
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('tenants', 'organizations', 'requirements', 'compliance_records', 'regulatory_documents', 'users')
ORDER BY tablename, policyname;
