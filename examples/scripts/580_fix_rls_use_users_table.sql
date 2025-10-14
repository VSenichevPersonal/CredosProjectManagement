-- Fix RLS policies to get tenant_id from users table instead of JWT
-- Problem: JWT doesn't contain tenant_id, it's only in the users table
-- Solution: Query users table to get tenant_id for RLS checks

-- Drop existing policies
DROP POLICY IF EXISTS "control_measures_select_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_insert_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_update_policy" ON control_measures;
DROP POLICY IF EXISTS "control_measures_delete_policy" ON control_measures;

-- Create new policies that get tenant_id from users table
CREATE POLICY "control_measures_select_policy" ON control_measures
  FOR SELECT
  TO authenticated
  USING (
    -- Check tenant_id matches user's tenant
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      -- Super admin can see all measures in their tenant
      (SELECT organization_id FROM users WHERE id = auth.uid()) IS NULL
      OR
      -- Regular users can only see measures for their organization
      organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "control_measures_insert_policy" ON control_measures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check tenant_id matches user's tenant
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      -- Super admin can create measures for any organization in their tenant
      (SELECT organization_id FROM users WHERE id = auth.uid()) IS NULL
      OR
      -- Regular users can only create measures for their organization
      organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "control_measures_update_policy" ON control_measures
  FOR UPDATE
  TO authenticated
  USING (
    -- Check tenant_id matches user's tenant
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      -- Super admin can update all measures in their tenant
      (SELECT organization_id FROM users WHERE id = auth.uid()) IS NULL
      OR
      -- Regular users can only update measures for their organization
      organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (
      -- Only super admin can update locked measures
      (SELECT organization_id FROM users WHERE id = auth.uid()) IS NULL
      OR
      is_locked = false
    )
  );

CREATE POLICY "control_measures_delete_policy" ON control_measures
  FOR DELETE
  TO authenticated
  USING (
    -- Check tenant_id matches user's tenant
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      -- Only super admin can delete measures
      (SELECT organization_id FROM users WHERE id = auth.uid()) IS NULL
    )
  );

-- Add index to optimize RLS policy checks
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(id);
CREATE INDEX IF NOT EXISTS idx_control_measures_tenant_org ON control_measures(tenant_id, organization_id);

SELECT 'RLS policies fixed to use users table instead of JWT' as status;
