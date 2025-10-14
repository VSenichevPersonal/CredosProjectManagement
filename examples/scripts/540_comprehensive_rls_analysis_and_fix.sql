-- =====================================================
-- COMPREHENSIVE RLS ANALYSIS AND FIX
-- =====================================================
-- Анализ и исправление всех RLS политик для control_measures
-- и связанных таблиц с учетом модели данных

-- =====================================================
-- ПРОБЛЕМА: Текущие RLS политики не учитывают:
-- 1. Tenant isolation (все запросы должны фильтроваться по tenant_id)
-- 2. Правильную проверку organization_id через users таблицу
-- 3. Роли пользователей (super_admin, ib_manager, ib_specialist)
-- 4. Locked меры могут редактировать только super_admin и ib_manager
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =====================================================

-- Control Measures
DROP POLICY IF EXISTS "control_measures_select_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_insert_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_update_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_delete_policy" ON control_measures;
DROP POLICY IF EXISTS "Users can view their organization measures" ON control_measures;
DROP POLICY IF EXISTS "Users can insert measures for their organization" ON control_measures;
DROP POLICY IF EXISTS "Users can update their organization measures" ON control_measures;

-- Control Measure Templates
DROP POLICY IF EXISTS "Authenticated users can view templates" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_select_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_insert_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_update_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_delete_policy" ON control_measure_templates;

-- Evidence Types
DROP POLICY IF EXISTS "Authenticated users can view evidence types" ON evidence_types;
DROP POLICY IF EXISTS "evidence_types_select_policy" ON evidence_types;

-- =====================================================
-- STEP 2: CREATE HELPER FUNCTION FOR USER CONTEXT
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_context()
RETURNS TABLE (
  user_id UUID,
  tenant_id UUID,
  organization_id UUID,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    u.tenant_id,
    u.organization_id,
    u.role::TEXT as user_role
  FROM users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- STEP 3: CONTROL_MEASURES RLS POLICIES
-- =====================================================

-- SELECT: Users see measures from their organization within their tenant
CREATE POLICY "control_measures_select_policy" ON control_measures
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_context() uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND (
        -- Super admin sees all measures in tenant
        uc.user_role = 'super_admin'
        OR
        -- Others see only their organization's measures
        control_measures.organization_id = uc.organization_id
      )
    )
  );

-- INSERT: Users can create measures for their organization
CREATE POLICY "control_measures_insert_policy" ON control_measures
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM get_user_context() uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND (
        -- Super admin can create for any organization in tenant
        uc.user_role = 'super_admin'
        OR
        -- Others can create only for their organization
        control_measures.organization_id = uc.organization_id
      )
    )
  );

-- UPDATE: Users can update measures with restrictions on locked measures
CREATE POLICY "control_measures_update_policy" ON control_measures
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_context() uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND (
        -- Super admin can update all measures
        uc.user_role = 'super_admin'
        OR
        -- IB Manager can update all measures in their organization (including locked)
        (uc.user_role = 'ib_manager' AND control_measures.organization_id = uc.organization_id)
        OR
        -- IB Specialist can update only unlocked measures in their organization
        (uc.user_role = 'ib_specialist' AND control_measures.organization_id = uc.organization_id AND control_measures.is_locked = false)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM get_user_context() uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND (
        uc.user_role = 'super_admin'
        OR
        (uc.user_role = 'ib_manager' AND control_measures.organization_id = uc.organization_id)
        OR
        (uc.user_role = 'ib_specialist' AND control_measures.organization_id = uc.organization_id AND control_measures.is_locked = false)
      )
    )
  );

-- DELETE: Only super_admin and ib_manager can delete measures
CREATE POLICY "control_measures_delete_policy" ON control_measures
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_context() uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND (
        uc.user_role = 'super_admin'
        OR
        (uc.user_role = 'ib_manager' AND control_measures.organization_id = uc.organization_id)
      )
    )
  );

-- =====================================================
-- STEP 4: CONTROL_MEASURE_TEMPLATES RLS POLICIES
-- =====================================================

-- SELECT: All authenticated users can view active templates
CREATE POLICY "control_measure_templates_select_policy" ON control_measure_templates
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (
      -- Global templates (no tenant_id)
      tenant_id IS NULL
      OR
      -- Tenant-specific templates
      EXISTS (
        SELECT 1 FROM get_user_context() uc
        WHERE control_measure_templates.tenant_id = uc.tenant_id
      )
    )
  );

-- INSERT: Only super_admin can create templates
CREATE POLICY "control_measure_templates_insert_policy" ON control_measure_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM get_user_context() uc
      WHERE uc.user_role = 'super_admin'
      AND (
        control_measure_templates.tenant_id IS NULL
        OR control_measure_templates.tenant_id = uc.tenant_id
      )
    )
  );

-- UPDATE: Only super_admin can update templates
CREATE POLICY "control_measure_templates_update_policy" ON control_measure_templates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_context() uc
      WHERE uc.user_role = 'super_admin'
      AND (
        control_measure_templates.tenant_id IS NULL
        OR control_measure_templates.tenant_id = uc.tenant_id
      )
    )
  );

-- DELETE: Only super_admin can delete templates
CREATE POLICY "control_measure_templates_delete_policy" ON control_measure_templates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_context() uc
      WHERE uc.user_role = 'super_admin'
      AND (
        control_measure_templates.tenant_id IS NULL
        OR control_measure_templates.tenant_id = uc.tenant_id
      )
    )
  );

-- =====================================================
-- STEP 5: EVIDENCE_TYPES RLS POLICIES
-- =====================================================

-- SELECT: All authenticated users can view active evidence types
CREATE POLICY "evidence_types_select_policy" ON evidence_types
  FOR SELECT TO authenticated
  USING (is_active = true);

-- =====================================================
-- STEP 6: VERIFY RLS IS ENABLED
-- =====================================================

ALTER TABLE control_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_measure_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_types ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: GRANT NECESSARY PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON control_measures TO authenticated;
GRANT SELECT ON control_measure_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON control_measure_templates TO authenticated;
GRANT SELECT ON evidence_types TO authenticated;

-- =====================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_control_measures_tenant_org 
  ON control_measures(tenant_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_control_measures_tenant_locked 
  ON control_measures(tenant_id, is_locked);

CREATE INDEX IF NOT EXISTS idx_users_tenant_org_role 
  ON users(tenant_id, organization_id, role);

-- =====================================================
-- COMPLETED
-- =====================================================
-- Все RLS политики обновлены с учетом:
-- 1. Tenant isolation
-- 2. Organization-based access control
-- 3. Role-based permissions (super_admin, ib_manager, ib_specialist)
-- 4. Locked measure restrictions
-- 5. Performance optimization через индексы
-- =====================================================
