-- Add composite indexes for better query performance
-- These indexes optimize the most common query patterns

-- Organizations: Optimize hierarchy queries
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_parent 
  ON organizations(tenant_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_organizations_tenant_level 
  ON organizations(tenant_id, level);

-- Organizations: Optimize search and filtering
CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm 
  ON organizations USING gin(name gin_trgm_ops);

-- Users: Optimize tenant and organization filtering
CREATE INDEX IF NOT EXISTS idx_users_tenant_org 
  ON users(tenant_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_users_tenant_role 
  ON users(tenant_id, role);

-- Requirements: Optimize applicability queries
CREATE INDEX IF NOT EXISTS idx_requirements_tenant_status 
  ON requirements(tenant_id, status);

-- Compliance: Optimize status queries
CREATE INDEX IF NOT EXISTS idx_compliance_tenant_status 
  ON compliance(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_compliance_org_status 
  ON compliance(organization_id, status);

-- Evidence: Optimize organization queries
CREATE INDEX IF NOT EXISTS idx_evidence_tenant_org 
  ON evidence(tenant_id, organization_id);

-- Legal articles: Already created in script 125

-- Add pg_trgm extension for fuzzy text search if not exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Analyze tables to update statistics
ANALYZE organizations;
ANALYZE users;
ANALYZE requirements;
ANALYZE compliance;
ANALYZE evidence;
