-- Helper function to check if user can access organization
-- Returns true if:
-- 1. User is super_admin or regulator (can access all in tenant)
-- 2. Organization is user's own organization
-- 3. Organization is subordinate to user's organization

CREATE OR REPLACE FUNCTION can_access_organization(
  p_user_id UUID,
  p_organization_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_user_org_id UUID;
  v_org_tenant_id UUID;
  v_user_tenant_id UUID;
BEGIN
  -- Get user info
  SELECT role, organization_id, tenant_id
  INTO v_user_role, v_user_org_id, v_user_tenant_id
  FROM users
  WHERE id = p_user_id;
  
  -- Added check if user exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get organization tenant
  SELECT tenant_id
  INTO v_org_tenant_id
  FROM organizations
  WHERE id = p_organization_id;
  
  -- Added check if organization exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if same tenant
  IF v_user_tenant_id != v_org_tenant_id THEN
    RETURN FALSE;
  END IF;

  -- Super admin and regulator can access all in tenant
  IF v_user_role IN ('super_admin', 'regulator') THEN
    RETURN TRUE;
  END IF;

  -- User without organization cannot access
  IF v_user_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if organization is user's own or subordinate
  RETURN EXISTS (
    SELECT 1 FROM get_subordinate_organizations(v_user_org_id)
    WHERE id = p_organization_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_access_organization TO authenticated;

COMMENT ON FUNCTION can_access_organization IS 
'Check if user can access organization based on role and hierarchy';
