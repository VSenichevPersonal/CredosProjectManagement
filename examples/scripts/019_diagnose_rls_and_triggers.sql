-- Диагностика RLS политик и триггеров
-- Проверяет, что может вызывать "Database error querying schema"

-- 1. Проверка RLS политик на public.users
SELECT 
  'RLS Policies on public.users' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- 2. Проверка триггеров на auth.users
SELECT 
  'Triggers on auth.users' as check_name,
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- 3. Проверка триггеров на public.users
SELECT 
  'Triggers on public.users' as check_name,
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'users';

-- 4. Проверка foreign keys на public.users
SELECT 
  'Foreign Keys on public.users' as check_name,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users';

-- 5. Проверка, что пользователи существуют и правильно связаны
SELECT 
  'User sync check' as check_name,
  au.id as auth_user_id,
  au.email as auth_email,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.role as public_role,
  CASE 
    WHEN au.id = pu.id THEN 'SYNCED'
    ELSE 'MISMATCH'
  END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.email;
