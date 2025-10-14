-- Проверка настройки Supabase Auth
-- Этот скрипт проверяет триггеры, функции и RLS политики

-- 1. Проверка триггера для синхронизации auth.users → public.users
SELECT 
  'Auth Trigger' as check_name,
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname LIKE '%auth%' OR tgname LIKE '%user%';

-- 2. Проверка функции handle_new_user
SELECT 
  'handle_new_user function' as check_name,
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Проверка RLS политик на таблице users
SELECT 
  'RLS Policies on users' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- 4. Проверка данных в таблицах
SELECT 'Organizations count' as check_name, COUNT(*)::text as count FROM organizations;
SELECT 'Regulatory documents count' as check_name, COUNT(*)::text as count FROM regulatory_documents;
SELECT 'Users count' as check_name, COUNT(*)::text as count FROM users;

-- 5. Проверка пользователей в auth.users
SELECT 
  'Auth users count' as check_name,
  COUNT(*)::text as count
FROM auth.users;
