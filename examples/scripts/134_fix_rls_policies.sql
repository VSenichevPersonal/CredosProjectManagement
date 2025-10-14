-- Исправление RLS политик для organization_attributes
-- Удаляем политики, использующие app.current_tenant_id

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view organization attributes in their tenant" ON organization_attributes;
DROP POLICY IF EXISTS "Users can manage organization attributes in their tenant" ON organization_attributes;

-- Отключаем RLS для organization_attributes (как и для других таблиц)
ALTER TABLE organization_attributes DISABLE ROW LEVEL SECURITY;

-- Проверяем статус RLS для всех таблиц
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'requirements', 'organization_attributes', 'requirement_applicability')
ORDER BY tablename;

-- Убеждаемся, что все таблицы имеют rowsecurity = false
