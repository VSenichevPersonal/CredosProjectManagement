-- Add control_id to evidence table
ALTER TABLE evidence 
ADD COLUMN IF NOT EXISTS control_id UUID REFERENCES controls(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_evidence_control ON evidence(control_id);

-- Create control_evidence table
CREATE TABLE IF NOT EXISTS control_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(control_id, evidence_id, organization_id)
);

-- Create indexes for control_evidence
CREATE INDEX IF NOT EXISTS idx_control_evidence_control ON control_evidence(control_id);
CREATE INDEX IF NOT EXISTS idx_control_evidence_evidence ON control_evidence(evidence_id);
CREATE INDEX IF NOT EXISTS idx_control_evidence_org ON control_evidence(organization_id);
CREATE INDEX IF NOT EXISTS idx_control_evidence_tenant ON control_evidence(tenant_id);

SELECT 'Evidence-Control linking completed' AS status;
