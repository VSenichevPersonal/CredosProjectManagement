-- =====================================================
-- COMPREHENSIVE RLS FIX FOR COMPLIANCE HIERARCHY
-- =====================================================
-- Архитектурное решение для поддержки иерархии организаций:
-- 1. Super admin может работать с любой организацией
-- 2. Головные организации могут работать с подведомственными
-- 3. Обычные пользователи работают только со своей организацией

-- =====================================================
-- HELPER FUNCTION: Check if user can access organization
-- =====================================================

CREATE OR REPLACE FUNCTION can_access_organization(target_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_org_id UUID;
BEGIN
  -- Получаем роль и организацию пользователя
  user_role := auth.jwt() ->> 'role';
  user_org_id := (auth.jwt() ->> 'organization_id')::UUID;
  
  -- Super admin может работать с любой организацией
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Если у пользователя нет организации, запрещаем доступ
  IF user_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Проверяем, является ли target_org_id самой организацией пользователя
  IF target_org_id = user_org_id THEN
    RETURN TRUE;
  END IF;
  
  -- Проверяем, является ли target_org_id подведомственной организацией
  -- Используем рекурсивный запрос для проверки иерархии
  RETURN EXISTS (
    WITH RECURSIVE subordinates AS (
      -- Начинаем с организации пользователя
      SELECT id, parent_id
      FROM organizations
      WHERE id = user_org_id AND tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
      
      UNION ALL
      
      -- Рекурсивно находим все подведомственные организации
      SELECT o.id, o.parent_id
      FROM organizations o
      INNER JOIN subordinates s ON o.parent_id = s.id
      WHERE o.tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    )
    SELECT 1 FROM subordinates WHERE id = target_org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- FIX CONTROL_MEASURES RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "control_measures_select_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_insert_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_update_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_delete_policy" ON control_measures;
DROP POLICY IF EXISTS "Users can view their organization measures" ON control_measures;
DROP POLICY IF EXISTS "Users can insert measures for their organization" ON control_measures;
DROP POLICY IF EXISTS "Users can update their organization measures" ON control_measures;

CREATE POLICY "control_measures_select_policy" ON control_measures
  FOR SELECT TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
  );

CREATE POLICY "control_measures_insert_policy" ON control_measures
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
  );

CREATE POLICY "control_measures_update_policy" ON control_measures
  FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
    AND (
      -- Super admin и ib_manager могут обновлять locked меры
      auth.jwt() ->> 'role' IN ('super_admin', 'ib_manager')
      OR
      -- Остальные могут обновлять только unlocked меры
      is_locked = false
    )
  );

CREATE POLICY "control_measures_delete_policy" ON control_measures
  FOR DELETE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND auth.jwt() ->> 'role' = 'super_admin'
  );

-- =====================================================
-- FIX COMPLIANCE_RECORDS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "users_can_view_compliance_in_tenant" ON compliance_records;
DROP POLICY IF EXISTS "users_can_manage_compliance_in_tenant" ON compliance_records;
DROP POLICY IF EXISTS "Users can view their organization compliance" ON compliance_records;

CREATE POLICY "compliance_records_select_policy" ON compliance_records
  FOR SELECT TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
  );

CREATE POLICY "compliance_records_insert_policy" ON compliance_records
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
  );

CREATE POLICY "compliance_records_update_policy" ON compliance_records
  FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
  );

CREATE POLICY "compliance_records_delete_policy" ON compliance_records
  FOR DELETE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND auth.jwt() ->> 'role' IN ('super_admin', 'ib_manager')
  );

-- =====================================================
-- FIX EVIDENCE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "evidence_tenant_isolation" ON evidence;
DROP POLICY IF EXISTS "Users can view evidence for their organization" ON evidence;

CREATE POLICY "evidence_select_policy" ON evidence
  FOR SELECT TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
  );

CREATE POLICY "evidence_insert_policy" ON evidence
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
  );

CREATE POLICY "evidence_update_policy" ON evidence
  FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND can_access_organization(organization_id)
  );

CREATE POLICY "evidence_delete_policy" ON evidence
  FOR DELETE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      auth.jwt() ->> 'role' IN ('super_admin', 'ib_manager')
      OR
      uploaded_by = auth.uid()
    )
  );

-- =====================================================
-- FIX EVIDENCE_LINKS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "evidence_links_select_own_tenant" ON evidence_links;
DROP POLICY IF EXISTS "evidence_links_insert_admin" ON evidence_links;
DROP POLICY IF EXISTS "evidence_links_update_admin" ON evidence_links;
DROP POLICY IF EXISTS "evidence_links_delete_admin" ON evidence_links;

CREATE POLICY "evidence_links_select_policy" ON evidence_links
  FOR SELECT TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "evidence_links_insert_policy" ON evidence_links
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "evidence_links_update_policy" ON evidence_links
  FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "evidence_links_delete_policy" ON evidence_links
  FOR DELETE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

-- =====================================================
-- FIX CONTROL_MEASURE_EVIDENCE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view control_measure_evidence in their tenant" ON control_measure_evidence;
DROP POLICY IF EXISTS "Users can insert control_measure_evidence in their tenant" ON control_measure_evidence;
DROP POLICY IF EXISTS "Users can update control_measure_evidence in their tenant" ON control_measure_evidence;
DROP POLICY IF EXISTS "Users can delete control_measure_evidence in their tenant" ON control_measure_evidence;

CREATE POLICY "control_measure_evidence_select_policy" ON control_measure_evidence
  FOR SELECT TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "control_measure_evidence_insert_policy" ON control_measure_evidence
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "control_measure_evidence_update_policy" ON control_measure_evidence
  FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

CREATE POLICY "control_measure_evidence_delete_policy" ON control_measure_evidence
  FOR DELETE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

-- =====================================================
-- COMPLETED
-- =====================================================
