-- Create compliance_history table for audit trail
CREATE TABLE IF NOT EXISTS compliance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  compliance_record_id UUID NOT NULL REFERENCES compliance_records(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'status_changed', 'measure_added', 'measure_updated', 'evidence_added', 'evidence_removed', 'comment_added', 'assigned', 'reviewed'
  old_value JSONB, -- Previous value (for updates)
  new_value JSONB, -- New value
  changed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_history_compliance_record_id ON compliance_history(compliance_record_id);
CREATE INDEX IF NOT EXISTS idx_compliance_history_tenant_id ON compliance_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_history_event_type ON compliance_history(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_history_created_at ON compliance_history(created_at DESC);

-- Add RLS policies
ALTER TABLE compliance_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view history for their tenant
CREATE POLICY compliance_history_select_policy ON compliance_history
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy: Users can insert history for their tenant
CREATE POLICY compliance_history_insert_policy ON compliance_history
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Add comment
COMMENT ON TABLE compliance_history IS 'Audit trail for compliance record changes';
COMMENT ON COLUMN compliance_history.event_type IS 'Type of event: status_changed, measure_added, measure_updated, evidence_added, evidence_removed, comment_added, assigned, reviewed';
COMMENT ON COLUMN compliance_history.old_value IS 'Previous value (JSONB) for updates';
COMMENT ON COLUMN compliance_history.new_value IS 'New value (JSONB)';
