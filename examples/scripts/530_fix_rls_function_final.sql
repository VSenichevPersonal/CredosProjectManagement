-- =====================================================
-- FINAL FIX FOR RLS FUNCTION AND POLICIES
-- =====================================================
-- Проблема: функция can_access_organization() не работает корректно
-- Решение: упростить проверку и использовать прямые JWT claims

-- =====================================================
-- DROP OLD FUNCTION
-- =====================================================

-- Добавлен CASCADE для удаления зависимых объектов
DROP FUNCTION IF EXISTS can_access_organization(UUID) CASCADE;

-- =====================================================
-- SIMPLIFIED RLS POLICIES FOR CONTROL_MEASURES
-- =====================================================
-- Используем прямые проверки JWT claims вместо функции

DROP POLICY IF EXISTS "control_measures_select_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_insert_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_update_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_delete_policy" ON control_measures;

-- SELECT: Super admin видит всё, остальные только свою организацию
CREATE POLICY "control_measures_select_policy" ON control_measures
  FOR SELECT TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      -- Super admin видит всё
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      -- Остальные видят только свою организацию
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
  );

-- INSERT: Super admin может создавать для любой организации, остальные только для своей
CREATE POLICY "control_measures_insert_policy" ON control_measures
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      -- Super admin может создавать для любой организации
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      -- Остальные могут создавать только для своей организации
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
  );

-- UPDATE: Super admin может обновлять всё, остальные только свою организацию
CREATE POLICY "control_measures_update_policy" ON control_measures
  FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      -- Super admin может обновлять всё
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      -- Остальные могут обновлять только свою организацию
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
    AND (
      -- Super admin и ib_manager могут обновлять locked меры
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      -- Остальные могут обновлять только unlocked меры
      is_locked = false
    )
  );

-- DELETE: Только super admin может удалять
CREATE POLICY "control_measures_delete_policy" ON control_measures
  FOR DELETE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (auth.jwt() ->> 'organization_id') IS NULL
  );

-- =====================================================
-- SIMPLIFIED RLS POLICIES FOR COMPLIANCE_RECORDS
-- =====================================================

DROP POLICY IF EXISTS "compliance_records_select_policy" ON compliance_records;
DROP POLICY IF EXISTS "compliance_records_insert_policy" ON compliance_records;
DROP POLICY IF EXISTS "compliance_records_update_policy" ON compliance_records;
DROP POLICY IF EXISTS "compliance_records_delete_policy" ON compliance_records;

CREATE POLICY "compliance_records_select_policy" ON compliance_records
  FOR SELECT TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "compliance_records_insert_policy" ON compliance_records
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "compliance_records_update_policy" ON compliance_records
  FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "compliance_records_delete_policy" ON compliance_records
  FOR DELETE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (auth.jwt() ->> 'organization_id') IS NULL
  );

-- =====================================================
-- SIMPLIFIED RLS POLICIES FOR EVIDENCE
-- =====================================================

DROP POLICY IF EXISTS "evidence_select_policy" ON evidence;
DROP POLICY IF EXISTS "evidence_insert_policy" ON evidence;
DROP POLICY IF EXISTS "evidence_update_policy" ON evidence;
DROP POLICY IF EXISTS "evidence_delete_policy" ON evidence;

CREATE POLICY "evidence_select_policy" ON evidence
  FOR SELECT TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "evidence_insert_policy" ON evidence
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "evidence_update_policy" ON evidence
  FOR UPDATE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      organization_id = (auth.jwt() ->> 'organization_id')::UUID
    )
  );

CREATE POLICY "evidence_delete_policy" ON evidence
  FOR DELETE TO authenticated USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND (
      (auth.jwt() ->> 'organization_id') IS NULL
      OR
      uploaded_by = auth.uid()
    )
  );

-- =====================================================
-- COMPLETED
-- =====================================================
