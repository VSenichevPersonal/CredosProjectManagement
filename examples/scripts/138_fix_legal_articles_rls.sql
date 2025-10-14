-- Fix RLS policies for legal_articles table
-- This ensures legal articles are properly filtered by tenant_id

-- Drop existing policies if any
DROP POLICY IF EXISTS "legal_articles_tenant_isolation" ON legal_articles;
DROP POLICY IF EXISTS "legal_articles_select" ON legal_articles;
DROP POLICY IF EXISTS "legal_articles_insert" ON legal_articles;
DROP POLICY IF EXISTS "legal_articles_update" ON legal_articles;
DROP POLICY IF EXISTS "legal_articles_delete" ON legal_articles;

-- Enable RLS
ALTER TABLE legal_articles ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for SELECT
CREATE POLICY "legal_articles_tenant_isolation" ON legal_articles
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Create policy for INSERT
CREATE POLICY "legal_articles_insert" ON legal_articles
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Create policy for UPDATE
CREATE POLICY "legal_articles_update" ON legal_articles
  FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Create policy for DELETE
CREATE POLICY "legal_articles_delete" ON legal_articles
  FOR DELETE
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'legal_articles'
ORDER BY policyname;

SELECT 'Legal articles RLS policies created successfully' as status;
