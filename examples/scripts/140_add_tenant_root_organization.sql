-- Add root_organization_id to tenants table to link tenant with its root organization
-- This creates a bidirectional relationship: tenant -> root org and org -> tenant

-- Add root_organization_id column to tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS root_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_root_organization ON tenants(root_organization_id);

-- Add comment
COMMENT ON COLUMN tenants.root_organization_id IS 'Root organization for this tenant - top of the hierarchy';

-- Update existing tenants to link with their root organizations
-- Assuming root organizations have parent_id = NULL and level = 0
UPDATE tenants t
SET root_organization_id = o.id
FROM organizations o
WHERE o.tenant_id = t.id
  AND o.parent_id IS NULL
  AND o.level = 0
  AND t.root_organization_id IS NULL;
