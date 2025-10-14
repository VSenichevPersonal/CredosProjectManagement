-- Исправление RLS политик на таблице requirements
-- Убираем циклические зависимости, используем JWT claims

-- ============================================
-- 1. УДАЛЯЕМ ВСЕ СУЩЕСТВУЮЩИЕ ПОЛИТИКИ
-- ============================================

DROP POLICY IF EXISTS "Users can view requirements" ON requirements;
DROP POLICY IF EXISTS "Admins can manage requirements" ON requirements;
DROP POLICY IF EXISTS "users_can_view_requirements_in_tenant" ON requirements;
DROP POLICY IF EXISTS "admins_can_manage_requirements_in_tenant" ON requirements;
DROP POLICY IF EXISTS "requirements_select_policy" ON requirements;
DROP POLICY IF EXISTS "requirements_insert_policy" ON requirements;
DROP POLICY IF EXISTS "requirements_update_policy" ON requirements;
DROP POLICY IF EXISTS "requirements_delete_policy" ON requirements;

-- ============================================
-- 2. СОЗДАЁМ ПРАВИЛЬНЫЕ ПОЛИТИКИ БЕЗ ЦИКЛИЧЕСКИХ ЗАВИСИМОСТЕЙ
-- ============================================

-- SELECT: Пользователи видят требования своего тенанта (из JWT)
CREATE POLICY "requirements_select_own_tenant" ON requirements
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- INSERT: Только админы могут создавать требования
CREATE POLICY "requirements_insert_admin" ON requirements
  FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('super_admin', 'regulator_admin')
  );

-- UPDATE: Только админы могут обновлять требования
CREATE POLICY "requirements_update_admin" ON requirements
  FOR UPDATE
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('super_admin', 'regulator_admin')
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('super_admin', 'regulator_admin')
  );

-- DELETE: Только супер-админы могут удалять требования
CREATE POLICY "requirements_delete_super_admin" ON requirements
  FOR DELETE
  USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  );

-- ============================================
-- 3. ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'requirements'
ORDER BY policyname;
