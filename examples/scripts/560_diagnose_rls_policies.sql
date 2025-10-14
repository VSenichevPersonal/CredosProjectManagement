-- Diagnostic script to check current RLS policies on control_measures table
-- This will help us understand what's blocking inserts

-- 1. Check if RLS is enabled on control_measures
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'control_measures';

-- 2. List ALL policies on control_measures table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'control_measures'
ORDER BY policyname;

-- 3. Check current user context
SELECT 
  current_user as db_user,
  current_setting('request.jwt.claims', true) as jwt_claims;

-- 4. Test if we can insert a measure (this will fail, but shows us the exact error)
DO $$
BEGIN
  RAISE NOTICE 'Testing INSERT permission for super_admin...';
  
  -- This will fail, but we'll see the error
  INSERT INTO control_measures (
    compliance_record_id,
    requirement_id,
    organization_id,
    title,
    description,
    status,
    tenant_id,
    created_by
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    'Test Measure',
    'Test Description',
    'planned',
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ee90f7bd-b434-4c8c-a871-1c43a5b584fa'::uuid
  );
  
  RAISE NOTICE 'INSERT succeeded (unexpected!)';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'INSERT failed with error: %', SQLERRM;
END $$;
