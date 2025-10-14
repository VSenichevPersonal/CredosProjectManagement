-- Fix organization hierarchy - ensure proper parent_id relationships
-- This script analyzes and fixes parent_id relationships in organizations table

DO $$
DECLARE
  root_org_id UUID;
  orphaned_count INT;
BEGIN
  -- Find the root organization (should have parent_id = NULL)
  SELECT id INTO root_org_id
  FROM organizations
  WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Log the root organization
  RAISE NOTICE 'Root organization ID: %', root_org_id;

  -- Set root organization parent_id to NULL if it's not already
  UPDATE organizations
  SET parent_id = NULL
  WHERE id = root_org_id AND parent_id IS NOT NULL;

  -- Count orphaned organizations (those with invalid parent_id)
  SELECT COUNT(*) INTO orphaned_count
  FROM organizations o1
  WHERE o1.parent_id IS NOT NULL
    AND o1.tenant_id = '11111111-1111-1111-1111-111111111111'
    AND NOT EXISTS (
      SELECT 1 FROM organizations o2
      WHERE o2.id = o1.parent_id
        AND o2.tenant_id = o1.tenant_id
    );

  RAISE NOTICE 'Found % orphaned organizations', orphaned_count;

  -- Fix orphaned organizations by setting their parent to root
  UPDATE organizations o1
  SET parent_id = root_org_id
  WHERE o1.parent_id IS NOT NULL
    AND o1.tenant_id = '11111111-1111-1111-1111-111111111111'
    AND o1.id != root_org_id
    AND NOT EXISTS (
      SELECT 1 FROM organizations o2
      WHERE o2.id = o1.parent_id
        AND o2.tenant_id = o1.tenant_id
    );

  -- Log final hierarchy stats
  RAISE NOTICE 'Hierarchy fixed. Root: %, Children: %',
    root_org_id,
    (SELECT COUNT(*) FROM organizations WHERE parent_id = root_org_id);

END $$;

-- Verify hierarchy integrity
SELECT
  'Root organizations' as category,
  COUNT(*) as count
FROM organizations
WHERE parent_id IS NULL
  AND tenant_id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT
  'Child organizations' as category,
  COUNT(*) as count
FROM organizations
WHERE parent_id IS NOT NULL
  AND tenant_id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT
  'Orphaned organizations' as category,
  COUNT(*) as count
FROM organizations o1
WHERE o1.parent_id IS NOT NULL
  AND o1.tenant_id = '11111111-1111-1111-1111-111111111111'
  AND NOT EXISTS (
    SELECT 1 FROM organizations o2
    WHERE o2.id = o1.parent_id
      AND o2.tenant_id = o1.tenant_id
  );
