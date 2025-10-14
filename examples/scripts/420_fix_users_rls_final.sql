-- Fix infinite recursion in users table RLS policies
-- Root cause: Policies that reference users table in their USING clause create circular dependency
-- Solution: Use only auth.uid() and JWT claims, never query users table in policy conditions

-- Step 1: Drop ALL existing policies on users table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 2: Create simple, non-recursive policies

-- Allow users to read their own record using auth.uid() only
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own record
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role has full access (for migrations and system operations)
CREATE POLICY "users_service_role_all" ON public.users
  FOR ALL
  USING (
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'role' = 'service_role'
  );

-- Step 3: Add comments
COMMENT ON POLICY "users_select_own" ON public.users IS 
  'Users can read their own record. Uses only auth.uid() to avoid recursion.';

COMMENT ON POLICY "users_update_own" ON public.users IS 
  'Users can update their own record. Uses only auth.uid() to avoid recursion.';

COMMENT ON POLICY "users_service_role_all" ON public.users IS 
  'Service role has full access for system operations.';

-- Step 4: Verify policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users';
    
    RAISE NOTICE 'Total policies on users table: %', policy_count;
    
    IF policy_count = 3 THEN
        RAISE NOTICE '✓ Users table RLS policies fixed successfully';
    ELSE
        RAISE WARNING '⚠ Expected 3 policies, found %', policy_count;
    END IF;
END $$;
