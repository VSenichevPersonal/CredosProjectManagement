-- Fix infinite recursion in users table RLS policies
-- Problem: Policies were duplicated and had circular references (querying users from within users policies)

-- Step 1: Drop ALL existing policies on users table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 2: Create simple, non-circular policies

-- SELECT: Users can view users in their own tenant
-- Uses direct tenant_id comparison from auth.jwt() instead of subquery
CREATE POLICY "users_select_own_tenant" ON public.users
    FOR SELECT
    USING (
        tenant_id = (auth.jwt()->>'tenant_id')::uuid
        OR 
        role = 'super_admin'
    );

-- UPDATE: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- INSERT: Handled by trigger from auth.users, but allow for service role
CREATE POLICY "users_insert_service" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- DELETE: Only super admins can delete users
CREATE POLICY "users_delete_admin_only" ON public.users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
