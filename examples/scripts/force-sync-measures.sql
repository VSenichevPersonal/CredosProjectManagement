-- FORCE sync measures with disabled RLS (use with caution!)
-- This script temporarily disables RLS to create measures
-- Only run this if you're sure the data is correct

-- WARNING: This script requires superuser privileges or service role key
-- Run this in Supabase SQL Editor with service role key

BEGIN;

-- Step 1: Show what will be created
SELECT 
  '📋 Will create measures for these records:' as info,
  COUNT(DISTINCT cr.id) as compliance_records,
  SUM(array_length(r.suggested_control_measure_template_ids, 1)) as total_measures_to_create
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
WHERE r.suggested_control_measure_template_ids IS NOT NULL
  AND array_length(r.suggested_control_measure_template_ids, 1) > 0
  AND NOT EXISTS (
    SELECT 1 FROM control_measures cm 
    WHERE cm.compliance_record_id = cr.id
  );

-- Step 2: Create measures with explicit INSERT (bypassing potential RLS issues)
INSERT INTO control_measures (
  id,
  tenant_id,
  compliance_record_id,
  requirement_id,
  organization_id,
  template_id,
  title,
  description,
  implementation_notes,
  status,
  from_template,
  is_locked,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  cr.tenant_id,
  cr.id,
  cr.requirement_id,
  cr.organization_id,
  template_id,
  cmt.title,
  cmt.description,
  cmt.implementation_guide,
  'planned',
  true,
  (r.measure_mode = 'strict'),
  NOW(),
  NOW()
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
CROSS JOIN LATERAL unnest(r.suggested_control_measure_template_ids) as template_id
JOIN control_measure_templates cmt ON cmt.id = template_id
WHERE r.suggested_control_measure_template_ids IS NOT NULL
  AND array_length(r.suggested_control_measure_template_ids, 1) > 0
  AND NOT EXISTS (
    SELECT 1 FROM control_measures cm 
    WHERE cm.compliance_record_id = cr.id
    AND cm.template_id = template_id
  );

-- Step 3: Show results
SELECT 
  '✅ Created measures:' as info,
  COUNT(*) as total_created
FROM control_measures
WHERE created_at >= NOW() - INTERVAL '1 minute';

SELECT 
  '📊 Updated statistics:' as info,
  COUNT(DISTINCT compliance_record_id) as compliance_records_with_measures,
  COUNT(*) as total_measures
FROM control_measures
WHERE from_template = true;

-- Rollback or commit?
-- ROLLBACK; -- Uncomment to test without actually creating
COMMIT; -- Comment out if you want to test first

-- Step 4: Verify results
SELECT 
  'Final verification' as status,
  COUNT(*) as total_compliance_records,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM control_measures cm 
      WHERE cm.compliance_record_id = cr.id
    )
  ) as records_with_measures,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM control_measures cm 
      WHERE cm.compliance_record_id = cr.id
    )
    AND EXISTS (
      SELECT 1 FROM requirements r
      WHERE r.id = cr.requirement_id
      AND r.suggested_control_measure_template_ids IS NOT NULL
      AND array_length(r.suggested_control_measure_template_ids, 1) > 0
    )
  ) as records_still_without_measures
FROM compliance_records cr;

