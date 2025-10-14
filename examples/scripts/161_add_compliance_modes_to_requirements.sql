-- Migration: Add compliance mode columns to requirements table
-- Purpose: Enable flexible/strict mode switching for evidence types and control measures
-- Author: System Architect
-- Date: 2025-01-10

-- Step 1: Add mode columns to requirements table
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS measure_mode VARCHAR(20) DEFAULT 'flexible' 
  CHECK (measure_mode IN ('strict', 'flexible'));

ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS evidence_type_mode VARCHAR(20) DEFAULT 'flexible' 
  CHECK (evidence_type_mode IN ('strict', 'flexible'));

-- Step 2: Add columns for storing allowed/suggested items
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS allowed_evidence_type_ids UUID[] DEFAULT '{}';

ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS suggested_control_measure_template_ids UUID[] DEFAULT '{}';

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_requirements_measure_mode 
  ON requirements(measure_mode);

CREATE INDEX IF NOT EXISTS idx_requirements_evidence_type_mode 
  ON requirements(evidence_type_mode);

-- Step 4: Update existing requirements to have default values
UPDATE requirements 
SET 
  measure_mode = 'flexible',
  evidence_type_mode = 'flexible',
  allowed_evidence_type_ids = '{}',
  suggested_control_measure_template_ids = '{}'
WHERE measure_mode IS NULL OR evidence_type_mode IS NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN requirements.measure_mode IS 
  'Compliance mode for control measures: strict (only suggested templates) or flexible (any templates)';

COMMENT ON COLUMN requirements.evidence_type_mode IS 
  'Compliance mode for evidence types: strict (only allowed types) or flexible (any types)';

COMMENT ON COLUMN requirements.allowed_evidence_type_ids IS 
  'Array of evidence type IDs allowed in strict mode';

COMMENT ON COLUMN requirements.suggested_control_measure_template_ids IS 
  'Array of control measure template IDs suggested in strict mode';

-- Verification query
SELECT 
  COUNT(*) as total_requirements,
  COUNT(CASE WHEN measure_mode = 'flexible' THEN 1 END) as flexible_measure_mode,
  COUNT(CASE WHEN measure_mode = 'strict' THEN 1 END) as strict_measure_mode,
  COUNT(CASE WHEN evidence_type_mode = 'flexible' THEN 1 END) as flexible_evidence_mode,
  COUNT(CASE WHEN evidence_type_mode = 'strict' THEN 1 END) as strict_evidence_mode
FROM requirements;
