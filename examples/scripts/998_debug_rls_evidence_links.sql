-- =====================================================
-- DEBUG: RLS на evidence_links
-- =====================================================

-- 1. Проверить все RLS policies на evidence_links
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
WHERE tablename = 'evidence_links';

-- 2. Попробовать INSERT напрямую (тест)
-- Заменить на реальные UUID:
/*
INSERT INTO evidence_links (
  tenant_id,
  evidence_id,
  control_measure_id,
  relevance_score,
  created_by
) VALUES (
  '[tenant_id]',
  '[evidence_id]',
  '[control_measure_id]',
  5,
  '[user_id]'
);
*/

-- 3. Проверить существующие evidence_links
SELECT 
  id,
  evidence_id,
  control_measure_id,
  tenant_id,
  created_by,
  created_at
FROM evidence_links
ORDER BY created_at DESC
LIMIT 5;

