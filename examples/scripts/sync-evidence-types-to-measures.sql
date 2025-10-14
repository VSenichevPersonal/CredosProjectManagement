-- Sync allowed_evidence_type_ids from templates to control_measures
-- This fixes measures that were created without evidence type IDs

-- Step 1: Check current state
SELECT 
  '📊 Current state' as info,
  COUNT(*) as total_measures,
  COUNT(*) FILTER (
    WHERE allowed_evidence_type_ids IS NOT NULL 
    AND array_length(allowed_evidence_type_ids, 1) > 0
  ) as measures_with_types,
  COUNT(*) FILTER (
    WHERE allowed_evidence_type_ids IS NULL 
    OR array_length(allowed_evidence_type_ids, 1) IS NULL
    OR array_length(allowed_evidence_type_ids, 1) = 0
  ) as measures_without_types,
  COUNT(*) FILTER (WHERE template_id IS NOT NULL) as measures_from_template
FROM control_measures;

-- Step 2: Show sample of measures without types
SELECT 
  '❌ Measures without evidence types' as info,
  cm.id,
  cm.title,
  cm.template_id,
  cm.allowed_evidence_type_ids,
  cmt.title as template_title,
  cmt.recommended_evidence_type_ids as template_types,
  array_length(cmt.recommended_evidence_type_ids, 1) as types_to_copy
FROM control_measures cm
LEFT JOIN control_measure_templates cmt ON cmt.id = cm.template_id
WHERE (cm.allowed_evidence_type_ids IS NULL 
   OR array_length(cm.allowed_evidence_type_ids, 1) IS NULL
   OR array_length(cm.allowed_evidence_type_ids, 1) = 0)
  AND cm.template_id IS NOT NULL
LIMIT 10;

-- Step 3: Update measures to copy evidence types from templates
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

-- Step 4: Verify results
SELECT 
  '✅ After sync' as status,
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

-- Step 5: Show updated measures
SELECT 
  '✅ Updated measures' as info,
  cm.id,
  cm.title,
  cm.allowed_evidence_type_ids,
  array_length(cm.allowed_evidence_type_ids, 1) as types_count,
  cmt.title as template_title
FROM control_measures cm
LEFT JOIN control_measure_templates cmt ON cmt.id = cm.template_id
WHERE cm.allowed_evidence_type_ids IS NOT NULL
  AND array_length(cm.allowed_evidence_type_ids, 1) > 0
  AND cm.updated_at >= NOW() - INTERVAL '1 minute'
LIMIT 10;

