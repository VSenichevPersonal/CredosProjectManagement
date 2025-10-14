-- Step 7: Update RLS policies for evidence_links
-- This script creates RLS policies for the new evidence_links table

-- Drop existing policies if any
DROP POLICY IF EXISTS evidence_links_select_own_tenant ON evidence_links;
DROP POLICY IF EXISTS evidence_links_insert_admin ON evidence_links;
DROP POLICY IF EXISTS evidence_links_update_admin ON evidence_links;
DROP POLICY IF EXISTS evidence_links_delete_admin ON evidence_links;

-- SELECT: Users can view evidence links in their tenant
CREATE POLICY evidence_links_select_own_tenant ON evidence_links
  FOR SELECT
  USING (
    tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid
  );

-- INSERT: Admins and specialists can create evidence links in their tenant
CREATE POLICY evidence_links_insert_admin ON evidence_links
  FOR INSERT
  WITH CHECK (
    tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid
    AND (auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin', 'regulator_admin', 'org_admin', 'specialist'])
  );

-- UPDATE: Admins and specialists can update evidence links in their tenant
CREATE POLICY evidence_links_update_admin ON evidence_links
  FOR UPDATE
  USING (
    tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid
    AND (auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin', 'regulator_admin', 'org_admin', 'specialist'])
  )
  WITH CHECK (
    tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid
  );

-- DELETE: Only admins can delete evidence links
CREATE POLICY evidence_links_delete_admin ON evidence_links
  FOR DELETE
  USING (
    tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid
    AND (auth.jwt() ->> 'role'::text) = ANY (ARRAY['super_admin', 'regulator_admin', 'org_admin'])
  );

-- Verification query
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'evidence_links'
ORDER BY cmd, policyname;

-- Test query (should return 0 if no data yet, or actual count if data exists)
SELECT 
  'evidence_links RLS enabled' AS status,
  COUNT(*) AS total_links
FROM evidence_links;
