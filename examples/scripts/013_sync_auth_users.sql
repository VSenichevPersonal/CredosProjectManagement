-- =====================================================
-- Синхронизация пользователей из auth.users в public.users
-- =====================================================
-- Этот скрипт синхронизирует пользователей, созданных через Supabase Dashboard
-- ВАЖНО: Сначала создайте пользователей через Dashboard, затем запустите этот скрипт

-- Функция для синхронизации пользователя
CREATE OR REPLACE FUNCTION sync_user_from_auth(user_email TEXT, user_role TEXT, org_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Получаем ID пользователя из auth.users
  SELECT id INTO auth_user_id FROM auth.users WHERE email = user_email LIMIT 1;
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь % не найден в auth.users. Создайте его через Supabase Dashboard.', user_email;
  END IF;
  
  -- Вставляем или обновляем в public.users
  INSERT INTO users (
    id,
    email,
    name,
    role,
    organization_id,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    auth_user_id,
    user_email,
    COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth_user_id), user_email),
    user_role,
    org_id,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    organization_id = COALESCE(EXCLUDED.organization_id, users.organization_id),
    updated_at = NOW();
    
  RAISE NOTICE '✓ Синхронизирован пользователь: % (role: %)', user_email, user_role;
END;
$$;

-- =====================================================
-- Синхронизация пользователей
-- =====================================================
-- ВАЖНО: Перед запуском этого скрипта создайте пользователей через Supabase Dashboard:
-- Authentication > Users > Add User
-- 
-- Создайте следующих пользователей:
-- 1. admin@mail.ru (пароль: admin@mail.ru)
-- 2. regulator@mail.ru (пароль: regulator@mail.ru)
-- 3. ministry@mail.ru (пароль: ministry@mail.ru)
-- 4. institution@mail.ru (пароль: institution@mail.ru)
-- 5. ciso@mail.ru (пароль: ciso@mail.ru)
-- 6. auditor@mail.ru (пароль: auditor@mail.ru)

DO $$
DECLARE
  fstec_org_id UUID;
  ministry_org_id UUID;
  institution_org_id UUID;
BEGIN
  -- Получаем ID организаций
  SELECT id INTO fstec_org_id FROM organizations WHERE name ILIKE '%ФСТЭК%' LIMIT 1;
  SELECT id INTO ministry_org_id FROM organizations WHERE type = 'ministry' LIMIT 1;
  SELECT id INTO institution_org_id FROM organizations WHERE type = 'institution' LIMIT 1;
  
  RAISE NOTICE 'Синхронизация пользователей из auth.users в public.users...';
  RAISE NOTICE '';
  
  -- Синхронизируем пользователей
  PERFORM sync_user_from_auth('admin@mail.ru', 'super_admin', NULL);
  PERFORM sync_user_from_auth('regulator@mail.ru', 'regulator_admin', fstec_org_id);
  PERFORM sync_user_from_auth('ministry@mail.ru', 'ministry_user', ministry_org_id);
  PERFORM sync_user_from_auth('institution@mail.ru', 'institution_user', institution_org_id);
  PERFORM sync_user_from_auth('ciso@mail.ru', 'ciso', institution_org_id);
  PERFORM sync_user_from_auth('auditor@mail.ru', 'auditor', NULL);
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Синхронизация завершена!';
  RAISE NOTICE '========================================';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ОШИБКА: %', SQLERRM;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Пожалуйста, создайте пользователей через Supabase Dashboard:';
  RAISE NOTICE '1. Откройте Supabase Dashboard';
  RAISE NOTICE '2. Перейдите в Authentication > Users';
  RAISE NOTICE '3. Нажмите "Add User"';
  RAISE NOTICE '4. Создайте пользователей с email и паролем';
  RAISE NOTICE '5. Запустите этот скрипт снова';
  RAISE NOTICE '';
END $$;

-- Очистка
-- DROP FUNCTION IF EXISTS sync_user_from_auth(TEXT, TEXT, UUID);
