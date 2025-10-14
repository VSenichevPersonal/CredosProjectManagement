-- Create compliance_metrics table for caching readiness scores
CREATE TABLE IF NOT EXISTS compliance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  regulatory_framework_id UUID REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  
  -- Metrics
  total_requirements INTEGER NOT NULL DEFAULT 0,
  compliant_requirements INTEGER NOT NULL DEFAULT 0,
  non_compliant_requirements INTEGER NOT NULL DEFAULT 0,
  in_progress_requirements INTEGER NOT NULL DEFAULT 0,
  
  -- Scores (0-100)
  readiness_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  evidence_freshness_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  control_effectiveness_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Counts for dashboard
  critical_issues INTEGER NOT NULL DEFAULT 0,
  upcoming_deadlines INTEGER NOT NULL DEFAULT 0,
  stale_evidence INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_scores CHECK (
    readiness_score >= 0 AND readiness_score <= 100 AND
    evidence_freshness_score >= 0 AND evidence_freshness_score <= 100 AND
    control_effectiveness_score >= 0 AND control_effectiveness_score <= 100
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_metrics_tenant 
  ON compliance_metrics(tenant_id);

CREATE INDEX IF NOT EXISTS idx_compliance_metrics_organization 
  ON compliance_metrics(organization_id);

CREATE INDEX IF NOT EXISTS idx_compliance_metrics_framework 
  ON compliance_metrics(regulatory_framework_id);

CREATE INDEX IF NOT EXISTS idx_compliance_metrics_calculated 
  ON compliance_metrics(calculated_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_compliance_metrics_tenant_org 
  ON compliance_metrics(tenant_id, organization_id);

-- Enable RLS
ALTER TABLE compliance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view metrics for their tenant"
  ON compliance_metrics FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "System can insert metrics"
  ON compliance_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update metrics"
  ON compliance_metrics FOR UPDATE
  USING (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_compliance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_compliance_metrics_updated_at
  BEFORE UPDATE ON compliance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_metrics_updated_at();
