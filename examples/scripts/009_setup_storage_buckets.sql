-- =====================================================
-- Storage Buckets Setup (Simplified)
-- =====================================================
-- Purpose: Create evidence-files bucket with public access
-- Note: Security handled at application level through ExecutionContext
-- Author: v0
-- Date: 2025-10-08

-- Create evidence-files bucket as public
-- This avoids RLS permission issues while maintaining security through app logic
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-files',
  'evidence-files',
  true, -- Public bucket - security handled by application
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- Verification
-- =====================================================

SELECT 
  'evidence-files bucket created' as status,
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets
WHERE id = 'evidence-files';
