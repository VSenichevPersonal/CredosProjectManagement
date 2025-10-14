-- Link existing tenants to their root organizations
-- Each tenant should have a root organization at the top of the hierarchy

DO $$
DECLARE
  v_tenant_record RECORD;
  v_root_org_id UUID;
BEGIN
  -- Loop through all tenants
  FOR v_tenant_record IN 
    SELECT id, name, slug FROM tenants WHERE root_organization_id IS NULL
  LOOP
    RAISE NOTICE 'Processing tenant: % (slug: %)', v_tenant_record.name, v_tenant_record.slug;
    
    -- Find the root organization for this tenant (organization with no parent)
    SELECT id INTO v_root_org_id
    FROM organizations
    WHERE tenant_id = v_tenant_record.id
      AND parent_id IS NULL
      AND level = 0
    LIMIT 1;
    
    IF v_root_org_id IS NOT NULL THEN
      -- Link tenant to root organization
      UPDATE tenants
      SET root_organization_id = v_root_org_id
      WHERE id = v_tenant_record.id;
      
      RAISE NOTICE 'Linked tenant % to root organization %', v_tenant_record.name, v_root_org_id;
    ELSE
      RAISE WARNING 'No root organization found for tenant: %', v_tenant_record.name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Tenant-organization linking complete';
END $$;

-- Verify the links
SELECT 
  t.name as tenant_name,
  t.slug as tenant_slug,
  o.name as root_organization_name,
  o.id as root_organization_id
FROM tenants t
LEFT JOIN organizations o ON t.root_organization_id = o.id
ORDER BY t.created_at;
