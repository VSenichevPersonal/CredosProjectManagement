-- =====================================================
-- DEBUG: Проверка evidence_type_id
-- =====================================================

-- 1. Проверить последнее созданное evidence
SELECT 
  id,
  file_name,
  evidence_type_id,
  evidence_type_id IS NULL as type_is_null,
  created_at
FROM evidence
ORDER BY created_at DESC
LIMIT 5;

-- 2. Проверить RLS policies на evidence
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'evidence';

-- 3. Проверить можно ли читать evidence_type_id
SELECT 
  e.id,
  e.evidence_type_id,
  et.title as evidence_type_title
FROM evidence e
LEFT JOIN evidence_types et ON et.id = e.evidence_type_id
ORDER BY e.created_at DESC
LIMIT 3;

-- 4. Проверить constraint на evidence
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'evidence'::regclass;

