-- Диагностика RLS политик на таблице requirements

-- 1. Проверка, включен ли RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'requirements';

-- 2. Все политики на requirements
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'requirements'
ORDER BY policyname;

-- 3. Проверка дубликатов
SELECT 
  policyname,
  COUNT(*) as count
FROM pg_policies
WHERE tablename = 'requirements'
GROUP BY policyname
HAVING COUNT(*) > 1;

-- 4. Проверка данных в requirements
SELECT 
  tenant_id,
  COUNT(*) as requirements_count
FROM requirements
GROUP BY tenant_id
ORDER BY tenant_id;

-- 5. Проверка тенантов
SELECT 
  id,
  name,
  slug
FROM tenants
ORDER BY name;
