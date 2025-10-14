-- Restore RLS policies for organizations table with proper tenant isolation
-- This ensures database-level security while allowing application-level filtering

-- Drop existing policies if any
DROP POLICY IF EXISTS "organizations_tenant_isolation" ON organizations;
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policy for tenant isolation
-- Users can only see organizations from their own tenant
CREATE POLICY "organizations_tenant_isolation" ON organizations
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;

-- Add helpful comment
COMMENT ON POLICY "organizations_tenant_isolation" ON organizations IS 
  'Ensures users can only access organizations from their own tenant. Application-level filtering handles subordinate organization access.';
