-- Migration: Verify and fix applicability system schema
-- Purpose: Ensure all tables and RLS policies are correct for applicability
-- Author: System Architect
-- Date: 2025-01-10

-- Step 1: Verify requirement_applicability_rules table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_name = 'requirement_applicability_rules') THEN
    RAISE EXCEPTION 'Table requirement_applicability_rules does not exist!';
  END IF;
END $$;

-- Step 2: Verify requirement_organization_mappings table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_name = 'requirement_organization_mappings') THEN
    RAISE EXCEPTION 'Table requirement_organization_mappings does not exist!';
  END IF;
END $$;

-- Step 3: Check RLS policies on applicability tables
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('requirement_applicability_rules', 'requirement_organization_mappings')
GROUP BY tablename;

-- Step 4: Add missing indexes if needed
CREATE INDEX IF NOT EXISTS idx_applicability_rules_requirement_id 
  ON requirement_applicability_rules(requirement_id);

CREATE INDEX IF NOT EXISTS idx_applicability_rules_tenant_id 
  ON requirement_applicability_rules(tenant_id);

CREATE INDEX IF NOT EXISTS idx_org_mappings_requirement_id 
  ON requirement_organization_mappings(requirement_id);

CREATE INDEX IF NOT EXISTS idx_org_mappings_organization_id 
  ON requirement_organization_mappings(organization_id);

CREATE INDEX IF NOT EXISTS idx_org_mappings_tenant_id 
  ON requirement_organization_mappings(tenant_id);

-- Step 5: Verify data integrity
SELECT 
  'requirement_applicability_rules' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT requirement_id) as unique_requirements,
  COUNT(DISTINCT tenant_id) as unique_tenants
FROM requirement_applicability_rules

UNION ALL

SELECT 
  'requirement_organization_mappings' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT requirement_id) as unique_requirements,
  COUNT(DISTINCT tenant_id) as unique_tenants
FROM requirement_organization_mappings;
