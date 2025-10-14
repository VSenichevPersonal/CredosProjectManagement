-- Create requirement applicability rules table
CREATE TABLE IF NOT EXISTS requirement_applicability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('automatic', 'manual')),
  filter_rules JSONB, -- JSON with filter conditions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(requirement_id)
);

-- Create requirement organization mappings table
CREATE TABLE IF NOT EXISTS requirement_organization_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mapping_type VARCHAR(50) NOT NULL CHECK (mapping_type IN ('automatic', 'manual_include', 'manual_exclude')),
  reason TEXT, -- Reason for manual inclusion/exclusion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(requirement_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applicability_rules_requirement ON requirement_applicability_rules(requirement_id);
CREATE INDEX IF NOT EXISTS idx_applicability_rules_tenant ON requirement_applicability_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_mappings_requirement ON requirement_organization_mappings(requirement_id);
CREATE INDEX IF NOT EXISTS idx_org_mappings_organization ON requirement_organization_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_mappings_tenant ON requirement_organization_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_mappings_type ON requirement_organization_mappings(mapping_type);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_applicability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requirement_applicability_rules_updated_at
  BEFORE UPDATE ON requirement_applicability_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_applicability_updated_at();

CREATE TRIGGER requirement_organization_mappings_updated_at
  BEFORE UPDATE ON requirement_organization_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_applicability_updated_at();

-- Add comments
COMMENT ON TABLE requirement_applicability_rules IS 'Правила применимости требований к организациям';
COMMENT ON TABLE requirement_organization_mappings IS 'Связь требований с организациями (автоматическая и ручная)';
COMMENT ON COLUMN requirement_applicability_rules.filter_rules IS 'JSON с условиями фильтрации: {kiiCategory: [1,2], pdnLevel: [1,2,3], isFinancial: true}';
COMMENT ON COLUMN requirement_organization_mappings.mapping_type IS 'automatic - автоматически по правилам, manual_include - ручное добавление, manual_exclude - ручное исключение';

SELECT 'Applicability system created successfully' AS status;
