-- Junction table for many-to-many relationship between control measures and evidence
-- One evidence can confirm multiple measures (e.g., security certificate confirms firewall + encryption + access control)
-- One measure can have multiple pieces of evidence (e.g., config file + screenshot + audit report)

CREATE TABLE IF NOT EXISTS control_measure_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Foreign keys
  control_measure_id UUID NOT NULL REFERENCES control_measures(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  
  -- Optional metadata
  notes TEXT,
  relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 5), -- How relevant is this evidence to this measure (1-5)
  
  -- Audit fields
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique combination
  UNIQUE(control_measure_id, evidence_id)
);

-- Indexes for performance
CREATE INDEX idx_control_measure_evidence_measure ON control_measure_evidence(control_measure_id);
CREATE INDEX idx_control_measure_evidence_evidence ON control_measure_evidence(evidence_id);
CREATE INDEX idx_control_measure_evidence_tenant ON control_measure_evidence(tenant_id);

-- RLS policies
ALTER TABLE control_measure_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view control_measure_evidence in their tenant"
  ON control_measure_evidence FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert control_measure_evidence in their tenant"
  ON control_measure_evidence FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can update control_measure_evidence in their tenant"
  ON control_measure_evidence FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can delete control_measure_evidence in their tenant"
  ON control_measure_evidence FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Trigger for updated_at
CREATE TRIGGER update_control_measure_evidence_updated_at
  BEFORE UPDATE ON control_measure_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE control_measure_evidence IS 'Junction table linking evidence to control measures (many-to-many)';
COMMENT ON COLUMN control_measure_evidence.relevance_score IS 'How relevant is this evidence to this measure (1=low, 5=critical)';
