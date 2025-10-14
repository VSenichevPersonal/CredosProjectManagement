-- Fix RLS policies for users table to allow bootstrapping tenant_id
-- Problem: getCurrentUser() needs to read users table to get tenant_id,
-- but RLS policies require tenant_id in JWT claims to read users table
-- Solution: Allow users to read their own record using auth.uid() without tenant check

-- Drop existing policies that cause circular dependency
DROP POLICY IF EXISTS "users_select_own_tenant" ON public.users;
DROP POLICY IF EXISTS "Users can view themselves" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "users_can_view_users_in_tenant" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;

-- Create new policy that allows users to read their own record using auth.uid()
-- This breaks the circular dependency
CREATE POLICY "users_can_read_own_record_by_auth_uid" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow super admins to read all users (using role from users table, not JWT)
CREATE POLICY "super_admins_can_read_all_users" ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (for migrations and admin operations)
CREATE POLICY "service_role_full_access" ON public.users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

COMMENT ON POLICY "users_can_read_own_record_by_auth_uid" ON public.users IS 
  'Allows users to read their own record using auth.uid() to bootstrap tenant_id into session';
