-- Create organization_attributes table for extended filtering attributes
CREATE TABLE IF NOT EXISTS organization_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- КИИ attributes
  kii_category INTEGER CHECK (kii_category IN (1, 2, 3)),
  
  -- ПДн attributes
  pdn_level INTEGER CHECK (pdn_level IN (1, 2, 3, 4)),
  
  -- Industry flags
  is_financial BOOLEAN DEFAULT FALSE,
  is_healthcare BOOLEAN DEFAULT FALSE,
  is_government BOOLEAN DEFAULT FALSE,
  
  -- Other attributes
  employee_count INTEGER,
  has_foreign_data BOOLEAN DEFAULT FALSE,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(tenant_id, organization_id)
);

-- Create index for faster lookups
CREATE INDEX idx_org_attributes_org_id ON organization_attributes(organization_id);
CREATE INDEX idx_org_attributes_kii ON organization_attributes(kii_category) WHERE kii_category IS NOT NULL;
CREATE INDEX idx_org_attributes_pdn ON organization_attributes(pdn_level) WHERE pdn_level IS NOT NULL;

-- Add RLS policies
ALTER TABLE organization_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization attributes in their tenant"
  ON organization_attributes FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "Users can manage organization attributes in their tenant"
  ON organization_attributes FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Insert sample attributes for existing organizations
INSERT INTO organization_attributes (tenant_id, organization_id, kii_category, pdn_level, is_government, employee_count)
SELECT 
  tenant_id,
  id,
  CASE 
    WHEN type = 'institution' AND has_kii THEN 2
    ELSE NULL
  END,
  CASE 
    WHEN has_pdn THEN 2
    ELSE NULL
  END,
  type = 'ministry',
  employee_count
FROM organizations
ON CONFLICT (tenant_id, organization_id) DO NOTHING;
