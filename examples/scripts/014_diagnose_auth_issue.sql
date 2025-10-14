-- Диагностика проблемы с auth схемой
-- Этот скрипт проверяет структуру auth.users и auth.identities

-- 1. Проверка структуры auth.users
SELECT 
  'auth.users columns' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Проверка структуры auth.identities
SELECT 
  'auth.identities columns' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
  AND table_name = 'identities'
ORDER BY ordinal_position;

-- 3. Проверка пользователей в auth.users
SELECT 
  'auth.users data' as check_name,
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- 4. Проверка identities
SELECT 
  'auth.identities data' as check_name,
  id,
  user_id,
  provider,
  provider_id,
  created_at
FROM auth.identities
ORDER BY created_at DESC;

-- 5. Проверка пользователей в public.users
SELECT 
  'public.users data' as check_name,
  id,
  email,
  name,
  role,
  organization_id,
  is_active
FROM public.users
ORDER BY created_at DESC;
