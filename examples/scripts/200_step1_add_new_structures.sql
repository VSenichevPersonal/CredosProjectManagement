-- Step 1: Add new database structures for Continuous Compliance Architecture
-- This script adds new tables and columns without removing existing data

-- Add measure_mode enum to requirements
DO $$ BEGIN
  CREATE TYPE measure_mode AS ENUM ('flexible', 'strict');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add measure_mode column to requirements
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS measure_mode measure_mode DEFAULT 'flexible';

-- Add recommended_evidence_type_ids to control_measure_templates
ALTER TABLE control_measure_templates 
ADD COLUMN IF NOT EXISTS recommended_evidence_type_ids UUID[];

-- Create evidence_links table for many-to-many relationships
CREATE TABLE IF NOT EXISTS evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  control_measure_id UUID REFERENCES control_measures(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  
  -- Audit fields
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  link_reason TEXT,
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 5),
  
  -- Tenant isolation
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Constraints
  CONSTRAINT evidence_links_must_have_target CHECK (
    control_measure_id IS NOT NULL OR requirement_id IS NOT NULL
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_links_evidence 
  ON evidence_links(evidence_id);

CREATE INDEX IF NOT EXISTS idx_evidence_links_control_measure 
  ON evidence_links(control_measure_id);

CREATE INDEX IF NOT EXISTS idx_evidence_links_requirement 
  ON evidence_links(requirement_id);

CREATE INDEX IF NOT EXISTS idx_evidence_links_tenant 
  ON evidence_links(tenant_id);

CREATE INDEX IF NOT EXISTS idx_control_measure_templates_recommended_evidence 
  ON control_measure_templates USING GIN (recommended_evidence_type_ids);

-- Enable RLS on evidence_links
ALTER TABLE evidence_links ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger for evidence_links
CREATE OR REPLACE FUNCTION update_evidence_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_links_updated_at
  BEFORE UPDATE ON evidence_links
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_links_updated_at();

-- Verification query
SELECT 
  'evidence_links table created' AS status,
  COUNT(*) AS row_count 
FROM evidence_links;

SELECT 
  'recommended_evidence_type_ids column added' AS status,
  COUNT(*) AS templates_count
FROM control_measure_templates;

SELECT 
  'measure_mode column added' AS status,
  COUNT(*) AS requirements_count
FROM requirements;
