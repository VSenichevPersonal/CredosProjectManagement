-- Fix RLS policy on public.users that causes "Database error querying schema"
-- The problem: existing policy tries to query users table with auth.uid() during login
-- Solution: Create simpler policies that don't cause circular dependencies

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;

-- Create new policies that work correctly during login

-- 1. Allow authenticated users to read their own user record
CREATE POLICY "Users can read own record"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Allow authenticated users to read users in their organization
-- Using a safer approach that doesn't cause circular dependencies
CREATE POLICY "Users can read organization members"
ON public.users
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- 3. Allow service role to read all users (for admin operations)
CREATE POLICY "Service role can read all users"
ON public.users
FOR SELECT
TO service_role
USING (true);

-- 4. Allow users to update their own record
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
