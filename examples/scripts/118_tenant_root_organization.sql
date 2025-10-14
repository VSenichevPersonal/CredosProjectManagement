-- Migration: Tenant = Root Organization (Variant 1)
-- Purpose: Automatically create root organization for each tenant
-- Architecture: DDD, Provider pattern, Execution Context

-- ============================================================================
-- STEP 0: Create root organization type if not exists
-- ============================================================================

-- Add root organization type for tenant root organizations
INSERT INTO organization_types (code, name, description, icon, sort_order, is_active)
VALUES (
  'root',
  'Корневая организация',
  'Корневая организация тенанта (верхний уровень иерархии)',
  'Building2',
  0,
  true
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 1: Create trigger function for automatic root organization creation
-- ============================================================================

CREATE OR REPLACE FUNCTION create_root_organization_for_tenant()
RETURNS TRIGGER AS $$
DECLARE
  root_type_id UUID;
BEGIN
  -- Get root organization type ID
  SELECT id INTO root_type_id 
  FROM organization_types 
  WHERE code = 'root' 
  LIMIT 1;
  
  -- If root type doesn't exist, use first available type
  IF root_type_id IS NULL THEN
    SELECT id INTO root_type_id 
    FROM organization_types 
    WHERE is_active = true 
    ORDER BY sort_order 
    LIMIT 1;
  END IF;
  
  -- Create root organization with same ID as tenant
  INSERT INTO organizations (
    id,
    tenant_id,
    name,
    type_id,          -- Added type_id
    parent_id,
    level,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,           -- Root organization has same ID as tenant
    NEW.id,           -- Belongs to this tenant
    NEW.name,         -- Same name as tenant
    root_type_id,     -- Use root organization type
    NULL,             -- No parent (root level)
    0,                -- Level 0 = root
    NEW.is_active,    -- Same active status
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotent

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_root_organization_for_tenant() IS 
'Automatically creates root organization when tenant is created. Root org has same ID as tenant.';

-- ============================================================================
-- STEP 2: Create trigger on tenants table
-- ============================================================================

DROP TRIGGER IF EXISTS on_tenant_created ON tenants;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_root_organization_for_tenant();

COMMENT ON TRIGGER on_tenant_created ON tenants IS
'Ensures every tenant has a root organization automatically';

-- ============================================================================
-- STEP 3: Create constraint to prevent root organization deletion
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_root_organization_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this organization is a root organization (id = tenant_id)
  IF OLD.id = OLD.tenant_id THEN
    RAISE EXCEPTION 'Cannot delete root organization. Delete the tenant instead.'
      USING HINT = 'Root organizations are automatically managed with tenants';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_root_org_deletion ON organizations;

CREATE TRIGGER prevent_root_org_deletion
  BEFORE DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_root_organization_deletion();

-- ============================================================================
-- STEP 4: Create constraint to prevent root organization modification
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_root_organization_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a root organization
  IF OLD.id = OLD.tenant_id THEN
    -- Prevent changing parent_id
    IF NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
      RAISE EXCEPTION 'Cannot change parent_id of root organization'
        USING HINT = 'Root organizations must have parent_id = NULL';
    END IF;
    
    -- Prevent changing tenant_id
    IF NEW.tenant_id != OLD.tenant_id THEN
      RAISE EXCEPTION 'Cannot change tenant_id of root organization'
        USING HINT = 'Root organizations are bound to their tenant';
    END IF;
    
    -- Prevent changing level
    IF NEW.level != 0 THEN
      RAISE EXCEPTION 'Cannot change level of root organization'
        USING HINT = 'Root organizations must have level = 0';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_root_org_modification ON organizations;

CREATE TRIGGER prevent_root_org_modification
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_root_organization_modification();

-- ============================================================================
-- STEP 5: Migrate existing tenants to have root organizations
-- ============================================================================

-- Create root organizations for existing tenants with type_id
DO $$
DECLARE
  root_type_id UUID;
BEGIN
  -- Get root organization type ID
  SELECT id INTO root_type_id 
  FROM organization_types 
  WHERE code = 'root' 
  LIMIT 1;
  
  -- If root type doesn't exist, use first available type
  IF root_type_id IS NULL THEN
    SELECT id INTO root_type_id 
    FROM organization_types 
    WHERE is_active = true 
    ORDER BY sort_order 
    LIMIT 1;
  END IF;
  
  -- Create root organizations for existing tenants
  INSERT INTO organizations (
    id,
    tenant_id,
    name,
    type_id,
    parent_id,
    level,
    is_active,
    created_at,
    updated_at
  )
  SELECT 
    t.id,
    t.id,
    t.name,
    root_type_id,  -- Use root organization type
    NULL,
    0,
    t.is_active,
    t.created_at,
    t.updated_at
  FROM tenants t
  WHERE NOT EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = t.id
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================================
-- STEP 6: Update existing organizations to be children of root
-- ============================================================================

-- Find organizations that should be children of root but aren't
UPDATE organizations o
SET 
  parent_id = o.tenant_id,
  level = CASE 
    WHEN parent_id IS NULL THEN 1  -- Was root, now level 1
    ELSE level + 1                  -- Increment level
  END,
  updated_at = NOW()
WHERE 
  o.parent_id IS NULL              -- Currently has no parent
  AND o.id != o.tenant_id          -- But is not the root organization
  AND EXISTS (                      -- And root organization exists
    SELECT 1 FROM organizations root 
    WHERE root.id = o.tenant_id 
    AND root.tenant_id = o.tenant_id
  );

-- ============================================================================
-- STEP 7: Create helper function to check if organization is root
-- ============================================================================

CREATE OR REPLACE FUNCTION is_root_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organizations
    WHERE id = org_id 
    AND id = tenant_id
    AND parent_id IS NULL
    AND level = 0
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_root_organization(UUID) IS
'Returns true if the organization is a root organization (id = tenant_id)';

-- ============================================================================
-- STEP 8: Create helper function to get root organization for tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION get_root_organization(p_tenant_id UUID)
RETURNS UUID AS $$
BEGIN
  -- Root organization has same ID as tenant
  RETURN p_tenant_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_root_organization(UUID) IS
'Returns the root organization ID for a given tenant (always equals tenant_id)';

-- ============================================================================
-- STEP 9: Add audit log entries for migration
-- ============================================================================

INSERT INTO audit_log (
  tenant_id,
  entity_type,
  entity_id,
  action,
  user_id,
  changes,
  created_at
)
SELECT 
  t.id,
  'tenant',
  t.id,
  'root_organization_created',
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1),
  jsonb_build_object(
    'migration', 'tenant_root_organization',
    'root_org_id', t.id,
    'root_org_name', t.name
  ),
  NOW()
FROM tenants t
WHERE EXISTS (
  SELECT 1 FROM organizations o 
  WHERE o.id = t.id AND o.tenant_id = t.id
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tenants have root organizations
DO $$
DECLARE
  tenant_count INTEGER;
  root_org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  SELECT COUNT(*) INTO root_org_count 
  FROM organizations 
  WHERE id = tenant_id AND parent_id IS NULL AND level = 0;
  
  IF tenant_count != root_org_count THEN
    RAISE WARNING 'Mismatch: % tenants but % root organizations', tenant_count, root_org_count;
  ELSE
    RAISE NOTICE 'Success: All % tenants have root organizations', tenant_count;
  END IF;
END $$;
