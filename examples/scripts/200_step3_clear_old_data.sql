-- Step 3: Clear old data (compliance records, control measures, evidence)
-- This script removes transactional data but keeps reference data

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- Clear evidence_links (if any exist)
TRUNCATE evidence_links CASCADE;

-- Clear evidence
TRUNCATE evidence CASCADE;

-- Clear control_measures
TRUNCATE control_measures CASCADE;

-- Clear compliance_records
TRUNCATE compliance_records CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verification queries
SELECT 'compliance_records' AS table_name, COUNT(*) AS row_count FROM compliance_records
UNION ALL
SELECT 'control_measures', COUNT(*) FROM control_measures
UNION ALL
SELECT 'evidence', COUNT(*) FROM evidence
UNION ALL
SELECT 'evidence_links', COUNT(*) FROM evidence_links
UNION ALL
SELECT 'requirements (should remain)', COUNT(*) FROM requirements
UNION ALL
SELECT 'evidence_types (should remain)', COUNT(*) FROM evidence_types
UNION ALL
SELECT 'control_measure_templates (should remain)', COUNT(*) FROM control_measure_templates
UNION ALL
SELECT 'organizations (should remain)', COUNT(*) FROM organizations;
