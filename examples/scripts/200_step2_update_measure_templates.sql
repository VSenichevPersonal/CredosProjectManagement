-- Step 2: Update control measure templates with recommended evidence types
-- This script populates recommended_evidence_type_ids based on measure type

-- First, let's see what evidence types we have
SELECT id, code, title FROM evidence_types ORDER BY code;

-- Fixed: using 'title' instead of 'name', and 'code' instead of 'slug'
-- Update templates based on their code prefix (AC-, NS-, DP-, VM-, IR-, CA-)

-- Access Control (AC-*): policy, procedure, config, log
UPDATE control_measure_templates
SET recommended_evidence_type_ids = ARRAY(
  SELECT id FROM evidence_types 
  WHERE code IN ('policy', 'procedure', 'config', 'log')
)
WHERE code LIKE 'AC-%'
  AND (recommended_evidence_type_ids IS NULL OR array_length(recommended_evidence_type_ids, 1) IS NULL);

-- Network Security (NS-*): config, report, screenshot, log
UPDATE control_measure_templates
SET recommended_evidence_type_ids = ARRAY(
  SELECT id FROM evidence_types 
  WHERE code IN ('config', 'report', 'screenshot', 'log')
)
WHERE code LIKE 'NS-%'
  AND (recommended_evidence_type_ids IS NULL OR array_length(recommended_evidence_type_ids, 1) IS NULL);

-- Data Protection (DP-*): policy, certificate, report, config
UPDATE control_measure_templates
SET recommended_evidence_type_ids = ARRAY(
  SELECT id FROM evidence_types 
  WHERE code IN ('policy', 'certificate', 'report', 'config')
)
WHERE code LIKE 'DP-%'
  AND (recommended_evidence_type_ids IS NULL OR array_length(recommended_evidence_type_ids, 1) IS NULL);

-- Vulnerability Management (VM-*): report, log, certificate
UPDATE control_measure_templates
SET recommended_evidence_type_ids = ARRAY(
  SELECT id FROM evidence_types 
  WHERE code IN ('report', 'log', 'certificate')
)
WHERE code LIKE 'VM-%'
  AND (recommended_evidence_type_ids IS NULL OR array_length(recommended_evidence_type_ids, 1) IS NULL);

-- Incident Response (IR-*): policy, procedure, log, report
UPDATE control_measure_templates
SET recommended_evidence_type_ids = ARRAY(
  SELECT id FROM evidence_types 
  WHERE code IN ('policy', 'procedure', 'log', 'report')
)
WHERE code LIKE 'IR-%'
  AND (recommended_evidence_type_ids IS NULL OR array_length(recommended_evidence_type_ids, 1) IS NULL);

-- Compliance and Audit (CA-*): policy, procedure, report, certificate
UPDATE control_measure_templates
SET recommended_evidence_type_ids = ARRAY(
  SELECT id FROM evidence_types 
  WHERE code IN ('policy', 'procedure', 'report', 'certificate')
)
WHERE code LIKE 'CA-%'
  AND (recommended_evidence_type_ids IS NULL OR array_length(recommended_evidence_type_ids, 1) IS NULL);

-- Default for any remaining templates
UPDATE control_measure_templates
SET recommended_evidence_type_ids = ARRAY(
  SELECT id FROM evidence_types 
  WHERE code IN ('policy', 'report', 'other')
  LIMIT 3
)
WHERE recommended_evidence_type_ids IS NULL 
   OR array_length(recommended_evidence_type_ids, 1) IS NULL;

-- Verification query
SELECT 
  code,
  title,
  array_length(recommended_evidence_type_ids, 1) AS evidence_types_count,
  (
    SELECT array_agg(et.title)
    FROM evidence_types et
    WHERE et.id = ANY(cmt.recommended_evidence_type_ids)
  ) AS evidence_type_names
FROM control_measure_templates cmt
ORDER BY code;
