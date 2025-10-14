-- Скрипт для создания пользователей в Supabase Auth
-- Использует расширение pgcrypto для хеширования паролей

-- Создаем пользователей в auth.users
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
  regulator_id UUID := gen_random_uuid();
  ministry_id UUID := gen_random_uuid();
  institution_id UUID := gen_random_uuid();
  ciso_id UUID := gen_random_uuid();
  auditor_id UUID := gen_random_uuid();
  encrypted_password TEXT;
  fstec_org_id UUID;
  ministry_org_id UUID;
  institution_org_id UUID;
BEGIN
  -- Получаем ID организаций
  SELECT id INTO fstec_org_id FROM organizations WHERE name = 'ФСТЭК России' LIMIT 1;
  SELECT id INTO ministry_org_id FROM organizations WHERE name = 'Министерство обороны РФ' LIMIT 1;
  SELECT id INTO institution_org_id FROM organizations WHERE name = 'ФГУП "Охрана" Росгвардии' LIMIT 1;

  -- Хешируем пароль (все пользователи используют свой email как пароль)
  -- Используем bcrypt через crypt функцию
  encrypted_password := crypt('admin@mail.ru', gen_salt('bf'));

  -- 1. Super Admin
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    aud,
    role
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@mail.ru',
    encrypted_password,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    -- Fixed role value from 'Super Admin' to 'super_admin'
    jsonb_build_object('name', 'Системный администратор', 'role', 'super_admin'),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );

  -- 2. Regulator Admin (ФСТЭК)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    aud,
    role
  ) VALUES (
    regulator_id,
    '00000000-0000-0000-0000-000000000000',
    'regulator@mail.ru',
    crypt('regulator@mail.ru', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    -- Fixed role value from 'Regulator Admin' to 'regulator_admin'
    jsonb_build_object('name', 'Администратор ФСТЭК', 'role', 'regulator_admin', 'organization_id', fstec_org_id),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );

  -- 3. Ministry User
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    aud,
    role
  ) VALUES (
    ministry_id,
    '00000000-0000-0000-0000-000000000000',
    'ministry@mail.ru',
    crypt('ministry@mail.ru', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    -- Fixed role value from 'Ministry User' to 'ministry_user'
    jsonb_build_object('name', 'Сотрудник министерства', 'role', 'ministry_user', 'organization_id', ministry_org_id),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );

  -- 4. Institution User
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    aud,
    role
  ) VALUES (
    institution_id,
    '00000000-0000-0000-0000-000000000000',
    'institution@mail.ru',
    crypt('institution@mail.ru', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    -- Fixed role value from 'Institution User' to 'institution_user'
    jsonb_build_object('name', 'Сотрудник учреждения', 'role', 'institution_user', 'organization_id', institution_org_id),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );

  -- 5. CISO (IB Manager)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    aud,
    role
  ) VALUES (
    ciso_id,
    '00000000-0000-0000-0000-000000000000',
    'ciso@mail.ru',
    crypt('ciso@mail.ru', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    -- Fixed role value from 'ciso' to 'ib_manager'
    jsonb_build_object('name', 'Руководитель ИБ', 'role', 'ib_manager', 'organization_id', institution_org_id),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );

  -- 6. Auditor
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    aud,
    role
  ) VALUES (
    auditor_id,
    '00000000-0000-0000-0000-000000000000',
    'auditor@mail.ru',
    crypt('auditor@mail.ru', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    -- Fixed role value from 'Auditor' to 'auditor' (lowercase)
    jsonb_build_object('name', 'Аудитор', 'role', 'auditor'),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );

  -- Создаем identities для каждого пользователя
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    (admin_id, admin_id, jsonb_build_object('sub', admin_id::text, 'email', 'admin@mail.ru'), 'email', 'admin@mail.ru', NOW(), NOW(), NOW()),
    (regulator_id, regulator_id, jsonb_build_object('sub', regulator_id::text, 'email', 'regulator@mail.ru'), 'email', 'regulator@mail.ru', NOW(), NOW(), NOW()),
    (ministry_id, ministry_id, jsonb_build_object('sub', ministry_id::text, 'email', 'ministry@mail.ru'), 'email', 'ministry@mail.ru', NOW(), NOW(), NOW()),
    (institution_id, institution_id, jsonb_build_object('sub', institution_id::text, 'email', 'institution@mail.ru'), 'email', 'institution@mail.ru', NOW(), NOW(), NOW()),
    (ciso_id, ciso_id, jsonb_build_object('sub', ciso_id::text, 'email', 'ciso@mail.ru'), 'email', 'ciso@mail.ru', NOW(), NOW(), NOW()),
    (auditor_id, auditor_id, jsonb_build_object('sub', auditor_id::text, 'email', 'auditor@mail.ru'), 'email', 'auditor@mail.ru', NOW(), NOW(), NOW());

  RAISE NOTICE 'Пользователи успешно созданы в auth.users';
  RAISE NOTICE 'Триггер автоматически создаст записи в public.users';
END $$;

-- Проверяем результат
SELECT 
  'auth.users' as table_name,
  COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name,
  COUNT(*) as user_count
FROM public.users;
