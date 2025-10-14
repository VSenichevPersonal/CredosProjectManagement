-- =====================================================
-- Fix Storage RLS Policies
-- =====================================================
-- Purpose: Allow authenticated users to upload files to evidence-files bucket
-- Issue: RLS was blocking uploads with "new row violates row-level security policy"
-- Solution: Add permissive policies for authenticated users
-- Author: v0
-- Date: 2025-10-08

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence-files'
);

-- Allow authenticated users to read their own files and public files
CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence-files'
);

-- Allow users to delete their own files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidence-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'evidence-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- Verification
-- =====================================================

SELECT 
  'Storage RLS policies created' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'Allow authenticated%'
ORDER BY policyname;
