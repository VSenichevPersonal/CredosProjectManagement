-- IB Compliance Platform - Test Users Seed
-- Version: 1.0.0
-- Description: Create test users for each role with simple credentials

-- Note: In Supabase, users must be created through Auth API or Dashboard first
-- This script assumes users are already created in auth.users
-- For development, create these users manually in Supabase Dashboard:
-- 1. admin@mail.ru (password: admin@mail.ru)
-- 2. regulator@mail.ru (password: regulator@mail.ru)
-- 3. ministry@mail.ru (password: ministry@mail.ru)
-- 4. institution@mail.ru (password: institution@mail.ru)
-- 5. ciso@mail.ru (password: ciso@mail.ru)
-- 6. auditor@mail.ru (password: auditor@mail.ru)

-- Clear existing test users (optional - comment out if you want to keep existing data)
DELETE FROM users WHERE email LIKE '%@mail.ru';

-- Insert test users into public.users table
-- Note: UUIDs should match the auth.users IDs created in Supabase Auth

INSERT INTO users (id, email, name, role, organization_id, is_active)
VALUES 
  -- Super Admin (no organization)
  (
    gen_random_uuid(),
    'admin@mail.ru',
    'Системный Администратор',
    'super_admin',
    NULL,
    true
  ),
  
  -- Regulator Admin (ФСТЭК - no organization)
  (
    gen_random_uuid(),
    'regulator@mail.ru',
    'Инспектор ФСТЭК',
    'regulator_admin',
    NULL,
    true
  ),
  
  -- Ministry User (Министерство цифрового развития)
  (
    gen_random_uuid(),
    'ministry@mail.ru',
    'Сотрудник Министерства',
    'ministry_user',
    '00000000-0000-0000-0000-000000000001',
    true
  ),
  
  -- Institution User (ФГБУ "Центр информационных технологий")
  (
    gen_random_uuid(),
    'institution@mail.ru',
    'Специалист ЦИТ',
    'institution_user',
    '00000000-0000-0000-0000-000000000002',
    true
  ),
  
  -- CISO (ФГБУ "Центр информационных технологий")
  (
    gen_random_uuid(),
    'ciso@mail.ru',
    'CISO ЦИТ',
    'ciso',
    '00000000-0000-0000-0000-000000000002',
    true
  ),
  
  -- Auditor (no organization - can audit all)
  (
    gen_random_uuid(),
    'auditor@mail.ru',
    'Аудитор ИБ',
    'auditor',
    NULL,
    true
  )
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify inserted users
SELECT 
  email,
  name,
  role,
  organization_id,
  is_active
FROM users
WHERE email LIKE '%@mail.ru'
ORDER BY role;
