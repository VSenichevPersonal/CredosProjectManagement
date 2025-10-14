-- Diagnostic script to check why control measures are not being created
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check requirements with suggested templates
SELECT 
  'Requirements with suggested templates' as check_name,
  COUNT(*) FILTER (WHERE suggested_control_measure_template_ids IS NOT NULL 
                   AND array_length(suggested_control_measure_template_ids, 1) > 0) as with_templates,
  COUNT(*) FILTER (WHERE suggested_control_measure_template_ids IS NULL 
                   OR array_length(suggested_control_measure_template_ids, 1) IS NULL
                   OR array_length(suggested_control_measure_template_ids, 1) = 0) as without_templates,
  COUNT(*) as total
FROM requirements;

-- 2. Sample of requirements with templates
SELECT 
  id,
  code,
  title,
  measure_mode,
  suggested_control_measure_template_ids,
  array_length(suggested_control_measure_template_ids, 1) as template_count
FROM requirements
WHERE suggested_control_measure_template_ids IS NOT NULL
  AND array_length(suggested_control_measure_template_ids, 1) > 0
LIMIT 5;

-- 3. Check control measure templates
SELECT 
  'Control measure templates' as check_name,
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_active = true) as active_templates
FROM control_measure_templates;

-- 4. Check compliance records without measures
SELECT 
  cr.id as compliance_record_id,
  cr.requirement_id,
  r.code as requirement_code,
  r.title as requirement_title,
  r.measure_mode,
  r.suggested_control_measure_template_ids,
  array_length(r.suggested_control_measure_template_ids, 1) as expected_measure_count,
  COUNT(cm.id) as actual_measure_count
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
WHERE r.suggested_control_measure_template_ids IS NOT NULL
  AND array_length(r.suggested_control_measure_template_ids, 1) > 0
GROUP BY cr.id, cr.requirement_id, r.code, r.title, r.measure_mode, r.suggested_control_measure_template_ids
HAVING COUNT(cm.id) = 0
LIMIT 10;

-- 5. Sample compliance record with measures (if any exist)
SELECT 
  cr.id as compliance_record_id,
  r.code as requirement_code,
  r.title as requirement_title,
  COUNT(cm.id) as measure_count,
  array_agg(cm.title) as measure_titles
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
GROUP BY cr.id, r.code, r.title
HAVING COUNT(cm.id) > 0
LIMIT 5;

-- 6. Check if control_measure_templates exist for suggested IDs
WITH requirement_templates AS (
  SELECT 
    r.id as requirement_id,
    r.code,
    unnest(r.suggested_control_measure_template_ids) as template_id
  FROM requirements r
  WHERE suggested_control_measure_template_ids IS NOT NULL
    AND array_length(suggested_control_measure_template_ids, 1) > 0
  LIMIT 10
)
SELECT 
  rt.requirement_id,
  rt.code,
  rt.template_id,
  CASE 
    WHEN cmt.id IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as template_status,
  cmt.title as template_title
FROM requirement_templates rt
LEFT JOIN control_measure_templates cmt ON cmt.id = rt.template_id;

-- 7. Summary
SELECT 
  'Summary' as info,
  (SELECT COUNT(*) FROM requirements) as total_requirements,
  (SELECT COUNT(*) FROM requirements 
   WHERE suggested_control_measure_template_ids IS NOT NULL 
   AND array_length(suggested_control_measure_template_ids, 1) > 0) as requirements_with_templates,
  (SELECT COUNT(*) FROM control_measure_templates) as total_templates,
  (SELECT COUNT(*) FROM compliance_records) as total_compliance_records,
  (SELECT COUNT(*) FROM control_measures) as total_control_measures,
  (SELECT COUNT(DISTINCT compliance_record_id) FROM control_measures) as compliance_records_with_measures;

