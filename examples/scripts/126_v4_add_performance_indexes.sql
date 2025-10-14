-- Add performance indexes for frequently queried columns
-- This script creates indexes only for existing columns

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- ORGANIZATIONS TABLE INDEXES
-- =====================================================

-- Composite index for hierarchy queries (parent_id + tenant_id)
CREATE INDEX IF NOT EXISTS idx_organizations_parent_tenant 
ON organizations(parent_id, tenant_id) 
WHERE parent_id IS NOT NULL;

-- Full-text search on organization names
CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm 
ON organizations USING gin(name gin_trgm_ops);

-- Index for active organizations filter
CREATE INDEX IF NOT EXISTS idx_organizations_active 
ON organizations(is_active, tenant_id) 
WHERE is_active = true;

-- =====================================================
-- USERS TABLE INDEXES
-- =====================================================

-- Composite index for user lookups by organization and role
CREATE INDEX IF NOT EXISTS idx_users_org_role 
ON users(organization_id, role, tenant_id);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_active 
ON users(is_active, tenant_id) 
WHERE is_active = true;

-- Index for email lookups with tenant
CREATE INDEX IF NOT EXISTS idx_users_email_tenant 
ON users(email, tenant_id);

-- =====================================================
-- REQUIREMENTS TABLE INDEXES
-- =====================================================

-- Full-text search on requirement titles
CREATE INDEX IF NOT EXISTS idx_requirements_title_trgm 
ON requirements USING gin(title gin_trgm_ops);

-- Composite index for requirement lookups
CREATE INDEX IF NOT EXISTS idx_requirements_framework_tenant 
ON requirements(regulatory_framework_id, tenant_id);

-- Index for requirement status filtering
CREATE INDEX IF NOT EXISTS idx_requirements_status_tenant 
ON requirements(status, tenant_id);

-- =====================================================
-- COMPLIANCE_RECORDS TABLE INDEXES
-- =====================================================

-- Composite index for compliance lookups by organization
CREATE INDEX IF NOT EXISTS idx_compliance_org_status 
ON compliance_records(organization_id, status, tenant_id);

-- Composite index for compliance lookups by requirement
CREATE INDEX IF NOT EXISTS idx_compliance_req_status 
ON compliance_records(requirement_id, status, tenant_id);

-- Index for next review date queries
CREATE INDEX IF NOT EXISTS idx_compliance_next_review 
ON compliance_records(next_review_date, tenant_id) 
WHERE next_review_date IS NOT NULL;

-- =====================================================
-- AUDIT_LOG TABLE INDEXES
-- =====================================================

-- Composite index for audit queries by entity
CREATE INDEX IF NOT EXISTS idx_audit_entity_tenant 
ON audit_log(entity_type, entity_id, tenant_id);

-- Index for audit queries by user
CREATE INDEX IF NOT EXISTS idx_audit_user_tenant 
ON audit_log(user_id, tenant_id);

-- Index for time-based audit queries
CREATE INDEX IF NOT EXISTS idx_audit_created_tenant 
ON audit_log(created_at DESC, tenant_id);

-- =====================================================
-- EVIDENCE TABLE INDEXES (if exists)
-- =====================================================

-- Composite index for evidence lookups
CREATE INDEX IF NOT EXISTS idx_evidence_compliance_tenant 
ON evidence(compliance_record_id, tenant_id);

-- Index for evidence status
CREATE INDEX IF NOT EXISTS idx_evidence_status_tenant 
ON evidence(status, tenant_id);

SELECT 'Performance indexes created successfully' AS status;
