-- =====================================================
-- FIX CONTROL MEASURES RLS POLICIES
-- =====================================================
-- Исправление RLS политик для таблицы control_measures
-- Проблема: super_admin не может создавать меры, т.к. у него нет organization_id

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view their organization measures" ON control_measures;
DROP POLICY IF EXISTS "Users can insert measures for their organization" ON control_measures;
DROP POLICY IF EXISTS "Users can update their organization measures" ON control_measures;

-- Создаём новые политики с поддержкой super_admin

-- SELECT: super_admin видит все меры, остальные - только своей организации
CREATE POLICY "control_measures_select_policy" ON control_measures
  FOR SELECT TO authenticated USING (
    -- Super admin видит всё
    (auth.jwt() ->> 'role' = 'super_admin')
    OR
    -- Остальные видят меры своей организации
    (
      organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- INSERT: super_admin может создавать меры для любой организации, остальные - только для своей
CREATE POLICY "control_measures_insert_policy" ON control_measures
  FOR INSERT TO authenticated WITH CHECK (
    -- Super admin может создавать для любой организации
    (auth.jwt() ->> 'role' = 'super_admin')
    OR
    -- Остальные могут создавать только для своей организации
    (
      organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- UPDATE: super_admin может обновлять любые меры, остальные - только своей организации
-- Locked меры могут обновлять только super_admin и ib_manager
CREATE POLICY "control_measures_update_policy" ON control_measures
  FOR UPDATE TO authenticated USING (
    -- Super admin может обновлять всё
    (auth.jwt() ->> 'role' = 'super_admin')
    OR
    -- IB manager может обновлять locked меры своей организации
    (
      auth.jwt() ->> 'role' = 'ib_manager'
      AND organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
    OR
    -- Остальные могут обновлять только unlocked меры своей организации
    (
      is_locked = false
      AND organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- DELETE: только super_admin может удалять меры
CREATE POLICY "control_measures_delete_policy" ON control_measures
  FOR DELETE TO authenticated USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- =====================================================
-- COMPLETED
-- =====================================================
