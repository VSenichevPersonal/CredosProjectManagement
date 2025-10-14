-- FINAL SOLUTION: Completely rebuild RLS policies for control_measures
-- This script will create a working RLS policy that allows super_admin to create measures

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE control_measures DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on control_measures
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'control_measures'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON control_measures', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE control_measures ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new, working policies

-- Policy 1: SELECT - Allow users to see measures for their tenant
CREATE POLICY control_measures_select_policy ON control_measures
  FOR SELECT
  USING (
    tenant_id::text = current_setting('request.jwt.claims', true)::json->>'tenantId'
  );

-- Policy 2: INSERT - Allow super_admin and users to create measures
CREATE POLICY control_measures_insert_policy ON control_measures
  FOR INSERT
  WITH CHECK (
    -- Allow if user is super_admin (no organization_id check needed)
    (current_setting('request.jwt.claims', true)::json->>'role' = 'super_admin')
    OR
    -- Allow if user is ib_manager
    (current_setting('request.jwt.claims', true)::json->>'role' = 'ib_manager')
    OR
    -- Allow if user belongs to the organization
    (organization_id::text = current_setting('request.jwt.claims', true)::json->>'organizationId')
  );

-- Policy 3: UPDATE - Allow super_admin, ib_manager, and measure owners
CREATE POLICY control_measures_update_policy ON control_measures
  FOR UPDATE
  USING (
    -- Allow if user is super_admin
    (current_setting('request.jwt.claims', true)::json->>'role' = 'super_admin')
    OR
    -- Allow if user is ib_manager
    (current_setting('request.jwt.claims', true)::json->>'role' = 'ib_manager')
    OR
    -- Allow if user created the measure
    (created_by::text = current_setting('request.jwt.claims', true)::json->>'sub')
    OR
    -- Allow if user belongs to the organization (and measure is not locked)
    (
      organization_id::text = current_setting('request.jwt.claims', true)::json->>'organizationId'
      AND (is_locked IS NULL OR is_locked = false)
    )
  );

-- Policy 4: DELETE - Only super_admin and ib_manager
CREATE POLICY control_measures_delete_policy ON control_measures
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'super_admin')
    OR
    (current_setting('request.jwt.claims', true)::json->>'role' = 'ib_manager')
  );

-- Step 5: Verify policies were created
SELECT 
  policyname,
  cmd as command,
  roles
FROM pg_policies
WHERE tablename = 'control_measures'
ORDER BY policyname;

-- Step 6: Test INSERT permission
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been rebuilt. Test INSERT from application to verify.';
END $$;
