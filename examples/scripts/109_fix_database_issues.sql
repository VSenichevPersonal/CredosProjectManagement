-- Fix database issues: add missing columns and fix RLS policies

-- 1. Add missing columns to compliance_records
ALTER TABLE compliance_records 
ADD COLUMN IF NOT EXISTS deadline DATE;

-- 2. Add missing columns to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_pdn BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_kii BOOLEAN DEFAULT false;

-- 3. Drop and recreate RLS policies for users table to fix infinite recursion
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;

-- Create simple, non-recursive RLS policies
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all users"
ON users FOR SELECT
USING (auth.role() = 'authenticated');

-- Fixed organization levels to use correct ENUM values
-- 4. Update organization levels based on type
UPDATE organizations 
SET level = CASE 
  WHEN type = 'regulator' THEN 1  -- ФСТЭК, регуляторы
  WHEN type = 'ministry' THEN 2   -- Министерства
  WHEN type = 'institution' THEN 3 -- Учреждения (больницы, школы)
  ELSE 0
END;

-- 5. Verify changes
SELECT 
  'compliance_records columns' as check_type,
  COUNT(*) FILTER (WHERE column_name = 'deadline') as has_deadline
FROM information_schema.columns 
WHERE table_name = 'compliance_records';

SELECT 
  'organizations columns' as check_type,
  COUNT(*) FILTER (WHERE column_name = 'level') as has_level,
  COUNT(*) FILTER (WHERE column_name = 'has_pdn') as has_pdn,
  COUNT(*) FILTER (WHERE column_name = 'has_kii') as has_kii
FROM information_schema.columns 
WHERE table_name = 'organizations';

SELECT 
  'users RLS policies' as check_type,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'users';
