-- =====================================================
-- Создание пользователей в Supabase Auth
-- =====================================================
-- Этот скрипт создает пользователей в auth.users и синхронизирует с public.users
-- ВАЖНО: Запускать в Supabase SQL Editor с правами администратора

-- Включаем расширение для работы с auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Функция для создания пользователя в auth.users
CREATE OR REPLACE FUNCTION create_auth_user(
  user_email TEXT,
  user_password TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  encrypted_pw TEXT;
BEGIN
  -- Генерируем UUID для пользователя
  user_id := uuid_generate_v4();
  
  -- Хешируем пароль (используем crypt из pgcrypto)
  encrypted_pw := crypt(user_password, gen_salt('bf'));
  
  -- Вставляем пользователя в auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    encrypted_pw,
    NOW(), -- email подтвержден сразу
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    user_metadata,
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    ''
  );
  
  -- Создаем identity для email провайдера
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,  -- Добавлена обязательная колонка
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_id,
    user_email,  -- provider_id = email для email провайдера
    jsonb_build_object('sub', user_id::text, 'email', user_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN user_id;
END;
$$;

-- =====================================================
-- Создание пользователей
-- =====================================================

DO $$
DECLARE
  admin_id UUID;
  regulator_id UUID;
  ministry_id UUID;
  institution_id UUID;
  ciso_id UUID;
  auditor_id UUID;
  
  fstec_org_id UUID;
  ministry_org_id UUID;
  institution_org_id UUID;
BEGIN
  -- Исправлено: используем name вместо code для поиска организаций
  -- Получаем ID организаций
  SELECT id INTO fstec_org_id FROM organizations WHERE name ILIKE '%ФСТЭК%' LIMIT 1;
  SELECT id INTO ministry_org_id FROM organizations WHERE type = 'ministry' LIMIT 1;
  SELECT id INTO institution_org_id FROM organizations WHERE type = 'institution' LIMIT 1;
  
  RAISE NOTICE 'Создание пользователей в Supabase Auth...';
  
  -- 1. Super Admin
  BEGIN
    admin_id := create_auth_user(
      'admin@mail.ru',
      'admin@mail.ru',
      '{"full_name": "Системный администратор"}'::jsonb
    );
    
    -- Обновляем запись в public.users
    UPDATE users 
    SET id = admin_id 
    WHERE email = 'admin@mail.ru';
    
    RAISE NOTICE '✓ Создан Super Admin: admin@mail.ru';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '⚠ Super Admin уже существует';
  END;
  
  -- 2. Regulator Admin (ФСТЭК)
  BEGIN
    regulator_id := create_auth_user(
      'regulator@mail.ru',
      'regulator@mail.ru',
      '{"full_name": "Администратор ФСТЭК"}'::jsonb
    );
    
    UPDATE users 
    SET id = regulator_id 
    WHERE email = 'regulator@mail.ru';
    
    RAISE NOTICE '✓ Создан Regulator Admin: regulator@mail.ru';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '⚠ Regulator Admin уже существует';
  END;
  
  -- 3. Ministry User
  BEGIN
    ministry_id := create_auth_user(
      'ministry@mail.ru',
      'ministry@mail.ru',
      '{"full_name": "Сотрудник министерства"}'::jsonb
    );
    
    UPDATE users 
    SET id = ministry_id 
    WHERE email = 'ministry@mail.ru';
    
    RAISE NOTICE '✓ Создан Ministry User: ministry@mail.ru';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '⚠ Ministry User уже существует';
  END;
  
  -- 4. Institution User
  BEGIN
    institution_id := create_auth_user(
      'institution@mail.ru',
      'institution@mail.ru',
      '{"full_name": "Сотрудник учреждения"}'::jsonb
    );
    
    UPDATE users 
    SET id = institution_id 
    WHERE email = 'institution@mail.ru';
    
    RAISE NOTICE '✓ Создан Institution User: institution@mail.ru';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '⚠ Institution User уже существует';
  END;
  
  -- 5. CISO
  BEGIN
    ciso_id := create_auth_user(
      'ciso@mail.ru',
      'ciso@mail.ru',
      '{"full_name": "Руководитель ИБ"}'::jsonb
    );
    
    UPDATE users 
    SET id = ciso_id 
    WHERE email = 'ciso@mail.ru';
    
    RAISE NOTICE '✓ Создан CISO: ciso@mail.ru';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '⚠ CISO уже существует';
  END;
  
  -- 6. Auditor
  BEGIN
    auditor_id := create_auth_user(
      'auditor@mail.ru',
      'auditor@mail.ru',
      '{"full_name": "Аудитор"}'::jsonb
    );
    
    UPDATE users 
    SET id = auditor_id 
    WHERE email = 'auditor@mail.ru';
    
    RAISE NOTICE '✓ Создан Auditor: auditor@mail.ru';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '⚠ Auditor уже существует';
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Пользователи успешно созданы!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Учетные данные для входа:';
  RAISE NOTICE '1. Super Admin: admin@mail.ru / admin@mail.ru';
  RAISE NOTICE '2. Regulator Admin: regulator@mail.ru / regulator@mail.ru';
  RAISE NOTICE '3. Ministry User: ministry@mail.ru / ministry@mail.ru';
  RAISE NOTICE '4. Institution User: institution@mail.ru / institution@mail.ru';
  RAISE NOTICE '5. CISO: ciso@mail.ru / ciso@mail.ru';
  RAISE NOTICE '6. Auditor: auditor@mail.ru / auditor@mail.ru';
  RAISE NOTICE '';
END $$;

-- Очистка: удаляем функцию после использования (опционально)
-- DROP FUNCTION IF EXISTS create_auth_user(TEXT, TEXT, JSONB);
