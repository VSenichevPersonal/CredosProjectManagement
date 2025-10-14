-- Verification script to check sync results
-- Run this to see the full picture after sync

-- 1. Overall statistics
SELECT 
  '📊 Overall Statistics' as section,
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
  ) as records_without_measures,
  (
    SELECT COUNT(*) 
    FROM control_measures 
    WHERE from_template = true
  ) as total_template_measures,
  (
    SELECT COUNT(*) 
    FROM control_measures 
    WHERE from_template = false
  ) as total_custom_measures
FROM compliance_records cr;

-- 2. Compare before/after
SELECT 
  '🔄 Before/After Comparison' as section,
  'Before' as status,
  3 as records_with_measures,
  7 as total_measures
UNION ALL
SELECT 
  '',
  'After',
  COUNT(DISTINCT cm.compliance_record_id),
  COUNT(*)
FROM control_measures cm
WHERE from_template = true;

-- 3. Breakdown by requirement
SELECT 
  '📋 By Requirement' as section,
  r.code,
  r.title,
  COUNT(DISTINCT cr.id) as compliance_records,
  COUNT(cm.id) as total_measures,
  ROUND(AVG(CASE WHEN cm.id IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100, 1) as coverage_percent
FROM requirements r
LEFT JOIN compliance_records cr ON cr.requirement_id = r.id
LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id AND cm.from_template = true
WHERE r.suggested_control_measure_template_ids IS NOT NULL
  AND array_length(r.suggested_control_measure_template_ids, 1) > 0
GROUP BY r.id, r.code, r.title
ORDER BY r.code;

-- 4. Check for any remaining gaps
SELECT 
  '⚠️  Remaining Gaps' as section,
  cr.id as compliance_record_id,
  r.code as requirement_code,
  r.title as requirement_title,
  array_length(r.suggested_control_measure_template_ids, 1) as expected_measures,
  COUNT(cm.id) as actual_measures,
  array_length(r.suggested_control_measure_template_ids, 1) - COUNT(cm.id) as missing_measures
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
WHERE r.suggested_control_measure_template_ids IS NOT NULL
  AND array_length(r.suggested_control_measure_template_ids, 1) > 0
GROUP BY cr.id, r.code, r.title, r.suggested_control_measure_template_ids
HAVING COUNT(cm.id) < array_length(r.suggested_control_measure_template_ids, 1)
ORDER BY r.code;

-- 5. Top 10 recently synced records
SELECT 
  '✅ Recently Synced' as section,
  cr.id as compliance_record_id,
  r.code as requirement_code,
  r.title as requirement_title,
  COUNT(cm.id) as measures_created,
  MAX(cm.created_at) as last_measure_created
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
JOIN control_measures cm ON cm.compliance_record_id = cr.id
WHERE cm.from_template = true
GROUP BY cr.id, r.code, r.title
ORDER BY MAX(cm.created_at) DESC
LIMIT 10;

-- 6. Summary with emojis
SELECT 
  '🎯 Summary' as section,
  CASE 
    WHEN records_without_measures = 0 THEN '✅ Perfect! All records have measures'
    WHEN records_without_measures < 5 THEN '⚠️  Almost there! Only ' || records_without_measures || ' records left'
    ELSE '❌ Need more work: ' || records_without_measures || ' records without measures'
  END as status,
  total_compliance_records as total_records,
  records_with_measures as success_count,
  records_without_measures as remaining_count,
  ROUND((records_with_measures::NUMERIC / total_compliance_records::NUMERIC) * 100, 1) as success_rate
FROM (
  SELECT 
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
    ) as records_without_measures
  FROM compliance_records cr
) stats;

