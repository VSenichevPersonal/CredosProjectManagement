-- Check all ENUM types and their values
SELECT 
  'compliance_status' as enum_name,
  enumlabel as enum_value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'compliance_status'
ORDER BY enumsortorder;

SELECT 
  'requirement_status' as enum_name,
  enumlabel as enum_value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'requirement_status'
ORDER BY enumsortorder;

SELECT 
  'criticality_level' as enum_name,
  enumlabel as enum_value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'criticality_level'
ORDER BY enumsortorder;
