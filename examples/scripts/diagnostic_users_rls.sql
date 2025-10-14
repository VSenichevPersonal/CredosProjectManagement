-- Diagnostic script to identify RLS policy issues on users table
-- This will help us understand what's causing the infinite recursion

-- 1. Check if RLS is enabled on users table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 2. List all policies on users table
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
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Count total policies on users table
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Check for duplicate policy names (this can cause issues)
SELECT 
    policyname,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'users'
GROUP BY policyname
HAVING COUNT(*) > 1;

-- 5. Show all functions that might be used in policies
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('auth.uid', 'get_user_tenant_id', 'is_admin', 'has_role')
   OR p.proname LIKE '%user%'
   OR p.proname LIKE '%tenant%';

-- 6. Check auth.users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 7. Check public.users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
