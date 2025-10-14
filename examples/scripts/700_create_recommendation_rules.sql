/**
 * Script: Create recommendation_rules table
 * Version: Stage 14.4
 * Purpose: Store configurable rules for Executive Summary recommendations
 */

-- Create recommendation_rules table
CREATE TABLE IF NOT EXISTS recommendation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Rule metadata
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'critical_requirements', 'overdue', 'missing_responsible', 'evidence_coverage', 'regulator_performance'
  
  -- Rule condition
  condition_type VARCHAR(50) NOT NULL, -- 'threshold', 'count', 'percentage', 'boolean'
  condition_field VARCHAR(100) NOT NULL, -- 'criticalCompletionRate', 'overdueCount', etc.
  condition_operator VARCHAR(20) NOT NULL, -- '<', '>', '<=', '>=', '==', '!='
  condition_value DECIMAL(10, 2) NOT NULL,
  
  -- Recommendation template
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  action_template TEXT NOT NULL,
  deadline_days INTEGER,
  estimated_budget_min DECIMAL(12, 2),
  estimated_budget_max DECIMAL(12, 2),
  legal_basis TEXT,
  
  -- Flags
  is_active BOOLEAN DEFAULT true,
  is_system_rule BOOLEAN DEFAULT false, -- System rules cannot be deleted
  sort_order INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Constraints
  CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  CHECK (condition_operator IN ('<', '>', '<=', '>=', '==', '!=')),
  CHECK (condition_type IN ('threshold', 'count', 'percentage', 'boolean'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_tenant ON recommendation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_active ON recommendation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_category ON recommendation_rules(category);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_priority ON recommendation_rules(priority);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_sort ON recommendation_rules(sort_order);

-- Enable RLS
ALTER TABLE recommendation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Simplified for MVP - tenant isolation only, role checks moved to application layer
CREATE POLICY "Users can view rules for their tenant"
  ON recommendation_rules FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert rules"
  ON recommendation_rules FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE tenant_id = recommendation_rules.tenant_id
    )
  );

CREATE POLICY "Authenticated users can update non-system rules"
  ON recommendation_rules FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE tenant_id = recommendation_rules.tenant_id
    )
    AND (is_system_rule = false)
  );

CREATE POLICY "Authenticated users can delete non-system rules"
  ON recommendation_rules FOR DELETE
  USING (
    is_system_rule = false
    AND auth.uid() IN (
      SELECT id FROM users 
      WHERE tenant_id = recommendation_rules.tenant_id
    )
  );

-- Note: Role-based access control should be implemented at application layer
-- using RBAC service to avoid enum value mismatches

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_recommendation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recommendation_rules_updated_at
  BEFORE UPDATE ON recommendation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_recommendation_rules_updated_at();

-- Add comment
COMMENT ON TABLE recommendation_rules IS 'Configurable rules for generating Executive Summary recommendations';

