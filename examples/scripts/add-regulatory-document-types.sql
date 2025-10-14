-- Migration: Add regulatory document types categorization
-- Description: Adds reference table for document types and links to regulatory frameworks

-- Step 1: Create regulatory_document_types reference table
CREATE TABLE IF NOT EXISTS regulatory_document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Type info
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Visual
  icon VARCHAR(50),
  color VARCHAR(50),
  
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- System types cannot be deleted
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, code)
);

-- Step 2: Add document_type_id to regulatory_frameworks
ALTER TABLE regulatory_frameworks
ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES regulatory_document_types(id) ON DELETE SET NULL;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_regulatory_document_types_tenant ON regulatory_document_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_document_types_code ON regulatory_document_types(code);
CREATE INDEX IF NOT EXISTS idx_regulatory_document_types_active ON regulatory_document_types(is_active);
CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_document_type ON regulatory_frameworks(document_type_id);

-- Step 4: Enable RLS
ALTER TABLE regulatory_document_types ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies
CREATE POLICY "Users can view document types in their tenant"
  ON regulatory_document_types FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage document types"
  ON regulatory_document_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin')
      AND tenant_id = regulatory_document_types.tenant_id
    )
  );

-- Step 6: Seed default document types for all tenants
INSERT INTO regulatory_document_types (tenant_id, code, name, description, icon, color, sort_order, is_system, is_active)
SELECT 
  t.id as tenant_id,
  'legislative' as code,
  'Законодательные' as name,
  'Федеральные законы, постановления правительства, приказы ведомств' as description,
  'scale' as icon,
  'blue' as color,
  1 as sort_order,
  true as is_system,
  true as is_active
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM regulatory_document_types 
  WHERE tenant_id = t.id AND code = 'legislative'
);

INSERT INTO regulatory_document_types (tenant_id, code, name, description, icon, color, sort_order, is_system, is_active)
SELECT 
  t.id as tenant_id,
  'internal' as code,
  'Внутренние' as name,
  'Внутренние политики, регламенты, инструкции организации' as description,
  'building' as icon,
  'purple' as color,
  2 as sort_order,
  true as is_system,
  true as is_active
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM regulatory_document_types 
  WHERE tenant_id = t.id AND code = 'internal'
);

INSERT INTO regulatory_document_types (tenant_id, code, name, description, icon, color, sort_order, is_system, is_active)
SELECT 
  t.id as tenant_id,
  'qms' as code,
  'СМК (ISO, ГОСТ)' as name,
  'Стандарты систем менеджмента качества (ISO 27001, ISO 9001, ГОСТ Р и др.)' as description,
  'award' as icon,
  'green' as color,
  3 as sort_order,
  true as is_system,
  true as is_active
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM regulatory_document_types 
  WHERE tenant_id = t.id AND code = 'qms'
);

-- Step 7: Update existing regulatory_frameworks based on category
UPDATE regulatory_frameworks rf
SET document_type_id = (
  SELECT id FROM regulatory_document_types rdt
  WHERE rdt.code = CASE
    WHEN rf.category IN ('federal_law', 'government_decree', 'agency_order') THEN 'legislative'
    WHEN rf.category = 'standard' THEN 'qms'
    ELSE 'legislative'
  END
  AND rdt.tenant_id = '00000000-0000-0000-0000-000000000000' -- default tenant
  LIMIT 1
)
WHERE document_type_id IS NULL;

-- Step 8: Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_regulatory_document_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_regulatory_document_types_updated_at
  BEFORE UPDATE ON regulatory_document_types
  FOR EACH ROW
  EXECUTE FUNCTION update_regulatory_document_types_updated_at();

-- Step 9: Add comments
COMMENT ON TABLE regulatory_document_types IS 'Reference table for categorizing regulatory documents (Legislative, Internal, QMS standards)';
COMMENT ON COLUMN regulatory_document_types.is_system IS 'System types cannot be deleted by users';
COMMENT ON COLUMN regulatory_frameworks.document_type_id IS 'Type of regulatory document (Legislative, Internal, QMS)';

SELECT 'Regulatory document types created successfully' AS status;
