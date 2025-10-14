-- Add support for required evidence types
-- This allows marking specific evidence types as mandatory vs optional

-- The requirements table already has:
-- - allowed_evidence_type_ids (ARRAY) - list of allowed evidence types
-- - evidence_type_mode (USER-DEFINED enum) - 'strict' or 'flexible'

-- Add a new column to store which evidence types are required (mandatory)
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS required_evidence_type_ids UUID[] DEFAULT '{}';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_requirements_required_evidence_type_ids 
  ON requirements USING GIN (required_evidence_type_ids);

-- Add comment
COMMENT ON COLUMN requirements.required_evidence_type_ids IS 
  'Array of evidence type IDs that are mandatory for this requirement. Subset of allowed_evidence_type_ids.';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'requirements' 
  AND column_name IN ('allowed_evidence_type_ids', 'required_evidence_type_ids', 'evidence_type_mode')
ORDER BY column_name;
