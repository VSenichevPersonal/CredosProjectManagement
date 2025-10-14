-- Add allowed_evidence_type_ids column to control_measures table
-- This allows each measure to specify which evidence types are required

-- Step 1: Check if column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'control_measures'
  AND column_name = 'allowed_evidence_type_ids';

-- Step 2: Add column if it doesn't exist
ALTER TABLE control_measures
ADD COLUMN IF NOT EXISTS allowed_evidence_type_ids UUID[];

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_control_measures_allowed_evidence_types
ON control_measures USING GIN (allowed_evidence_type_ids);

-- Step 4: Copy recommended_evidence_type_ids from templates to measures
UPDATE control_measures cm
SET 
  allowed_evidence_type_ids = cmt.recommended_evidence_type_ids,
  updated_at = NOW()
FROM control_measure_templates cmt
WHERE cm.template_id = cmt.id
  AND cm.from_template = true
  AND (
    cm.allowed_evidence_type_ids IS NULL 
    OR array_length(cm.allowed_evidence_type_ids, 1) IS NULL
    OR array_length(cm.allowed_evidence_type_ids, 1) = 0
  )
  AND cmt.recommended_evidence_type_ids IS NOT NULL
  AND array_length(cmt.recommended_evidence_type_ids, 1) > 0;

-- Step 5: Verify results
SELECT 
  '✅ Column added and data synced' as status,
  COUNT(*) as total_measures,
  COUNT(*) FILTER (
    WHERE allowed_evidence_type_ids IS NOT NULL 
    AND array_length(allowed_evidence_type_ids, 1) > 0
  ) as measures_with_types,
  COUNT(*) FILTER (
    WHERE allowed_evidence_type_ids IS NULL 
    OR array_length(allowed_evidence_type_ids, 1) IS NULL
    OR array_length(allowed_evidence_type_ids, 1) = 0
  ) as measures_without_types
FROM control_measures;

-- Step 6: Show sample of updated measures
SELECT 
  cm.id,
  cm.title,
  cm.allowed_evidence_type_ids,
  array_length(cm.allowed_evidence_type_ids, 1) as types_count,
  cmt.title as template_title
FROM control_measures cm
LEFT JOIN control_measure_templates cmt ON cmt.id = cm.template_id
WHERE cm.allowed_evidence_type_ids IS NOT NULL
  AND array_length(cm.allowed_evidence_type_ids, 1) > 0
LIMIT 5;

-- Step 7: Add comment
COMMENT ON COLUMN control_measures.allowed_evidence_type_ids IS 
'Array of evidence type IDs that are allowed/required for this measure. Copied from template.recommended_evidence_type_ids when measure is created from template.';

