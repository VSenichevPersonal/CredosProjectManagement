-- Migration: Add organization_id to evidence table for direct organization filtering
-- This allows documents to be directly associated with organizations without requiring compliance_records

-- Step 1: Add organization_id column (nullable, as some documents may be tenant-wide)
ALTER TABLE evidence 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 2: Populate organization_id from existing compliance_records
UPDATE evidence e
SET organization_id = cr.organization_id
FROM compliance_records cr
WHERE e.compliance_record_id = cr.id
  AND e.organization_id IS NULL;

-- Step 3: Add index for fast filtering by organization
CREATE INDEX IF NOT EXISTS idx_evidence_organization_id 
ON evidence(organization_id) 
WHERE organization_id IS NOT NULL;

-- Step 4: Add composite index for tenant + organization filtering
CREATE INDEX IF NOT EXISTS idx_evidence_tenant_organization 
ON evidence(tenant_id, organization_id) 
WHERE organization_id IS NOT NULL;

-- Step 5: Add index for actuality queries by organization
CREATE INDEX IF NOT EXISTS idx_evidence_org_actuality 
ON evidence(organization_id, actuality_status, next_review_date) 
WHERE organization_id IS NOT NULL AND is_document = true;

-- Step 6: Update RLS policies to include organization_id
-- Drop existing policy if exists
DROP POLICY IF EXISTS evidence_tenant_isolation ON evidence;

-- Fixed role values to use snake_case format (super_admin, regulator_admin)
-- Create new policy with organization support
CREATE POLICY evidence_tenant_isolation ON evidence
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    AND (
      -- User can see documents from their organization
      organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      -- Or tenant-wide documents (no organization_id)
      OR organization_id IS NULL
      -- Or user is super admin/regulator admin (can see all)
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'regulator_admin')
      )
    )
  );

-- Step 7: Add comment for documentation
COMMENT ON COLUMN evidence.organization_id IS 
'Direct reference to organization. NULL means document is tenant-wide (shared across all organizations).';
