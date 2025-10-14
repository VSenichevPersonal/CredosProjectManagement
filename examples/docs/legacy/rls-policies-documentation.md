# RLS Policies Documentation

## Overview

This document describes the Row Level Security (RLS) policies implemented for the IB Compliance Platform, specifically focusing on the control measures and related tables.

**Last Updated:** 2025-01-10  
**Version:** 2.1  
**Migration Script:** `scripts/540_comprehensive_rls_analysis_and_fix.sql`, `scripts/580_fix_rls_use_users_table.sql`

---

## Architecture

### Hierarchical Access Control

The RLS system implements a hierarchical access control model that supports:

1. **Tenant Isolation** - All data is isolated by `tenant_id`
2. **Organizational Hierarchy** - Super admins can access all organizations, head organizations can access subordinates
3. **Role-Based Permissions** - Different roles have different access levels

### User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `super_admin` | System administrator | Full access to all organizations in tenant |
| `ib_manager` | Information Security Manager | Full access to their organization, can edit locked measures |
| `ib_specialist` | Information Security Specialist | Access to their organization, cannot edit locked measures |

---

## Helper Functions

### `get_user_context()`

**Purpose:** Retrieves the current user's context from the JWT token and users table.

**Returns:**
\`\`\`sql
TABLE (
  user_id UUID,
  tenant_id UUID,
  organization_id UUID,
  user_role TEXT
)
\`\`\`

**Security:** `SECURITY DEFINER` - Runs with elevated privileges to access auth schema

**Usage:**
\`\`\`sql
SELECT * FROM get_user_context();
\`\`\`

### `can_access_organization(target_org_id UUID)`

**Purpose:** Checks if the current user can access a specific organization based on hierarchy.

**Logic:**
- Super admins can access any organization
- Users can access their own organization
- Head organizations can access subordinate organizations (recursive)

**Returns:** `BOOLEAN`

**Usage:**
\`\`\`sql
SELECT can_access_organization('org-uuid-here');
\`\`\`

---

## Table Policies

### control_measures

#### SELECT Policy
\`\`\`sql
CREATE POLICY "control_measures_select_policy" ON control_measures
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND auth.uid() = uc.id
      AND (
        uc.user_role = 'super_admin'
        OR
        control_measures.organization_id = uc.organization_id
      )
    )
  );
\`\`\`

**Access Rules:**
- Super admins see all measures in their tenant
- Other users see only their organization's measures

#### INSERT Policy
\`\`\`sql
CREATE POLICY "control_measures_insert_policy" ON control_measures
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND auth.uid() = uc.id
      AND (
        uc.user_role = 'super_admin'
        OR
        control_measures.organization_id = uc.organization_id
      )
    )
  );
\`\`\`

**Access Rules:**
- Super admins can create measures for any organization in their tenant
- Other users can create measures only for their organization

#### UPDATE Policy
\`\`\`sql
CREATE POLICY "control_measures_update_policy" ON control_measures
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND auth.uid() = uc.id
      AND (
        uc.user_role = 'super_admin'
        OR
        (uc.user_role = 'ib_manager' AND control_measures.organization_id = uc.organization_id)
        OR
        (uc.user_role = 'ib_specialist' AND control_measures.organization_id = uc.organization_id AND control_measures.is_locked = false)
      )
    )
  );
\`\`\`

**Access Rules:**
- Super admins can update all measures
- IB Managers can update all measures in their organization (including locked)
- IB Specialists can update only unlocked measures in their organization

#### DELETE Policy
\`\`\`sql
CREATE POLICY "control_measures_delete_policy" ON control_measures
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users uc
      WHERE control_measures.tenant_id = uc.tenant_id
      AND auth.uid() = uc.id
      AND (
        uc.user_role = 'super_admin'
        OR
        (uc.user_role = 'ib_manager' AND control_measures.organization_id = uc.organization_id)
      )
    )
  );
\`\`\`

**Access Rules:**
- Only super admins and IB managers can delete measures

---

### control_measure_templates

#### SELECT Policy
\`\`\`sql
CREATE POLICY "control_measure_templates_select_policy" ON control_measure_templates
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (
      tenant_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM users uc
        WHERE control_measure_templates.tenant_id = uc.tenant_id
        AND auth.uid() = uc.id
      )
    )
  );
\`\`\`

**Access Rules:**
- All authenticated users can view active templates
- Global templates (tenant_id IS NULL) are visible to everyone
- Tenant-specific templates are visible only to users in that tenant

#### INSERT/UPDATE/DELETE Policies
\`\`\`sql
-- Only super_admin can manage templates
\`\`\`

**Access Rules:**
- Only super admins can create, update, or delete templates

---

### evidence_types

#### SELECT Policy
\`\`\`sql
CREATE POLICY "evidence_types_select_policy" ON evidence_types
  FOR SELECT TO authenticated
  USING (is_active = true);
\`\`\`

**Access Rules:**
- All authenticated users can view active evidence types
- Evidence types are global (no tenant isolation)

---

## Performance Optimization

### Indexes

The following indexes are created to optimize RLS policy checks:

\`\`\`sql
-- Tenant and organization filtering
CREATE INDEX idx_control_measures_tenant_org 
  ON control_measures(tenant_id, organization_id);

-- Locked measure filtering
CREATE INDEX idx_control_measures_tenant_locked 
  ON control_measures(tenant_id, is_locked);

-- User context lookups
CREATE INDEX idx_users_tenant_org_role 
  ON users(tenant_id, organization_id, user_role);
\`\`\`

---

## Security Considerations

### Tenant Isolation

**Critical:** All policies MUST check `tenant_id` first to ensure complete tenant isolation.

\`\`\`sql
-- CORRECT
WHERE control_measures.tenant_id IN (
  SELECT tenant_id FROM users WHERE id = auth.uid()
)
  AND ...

-- INCORRECT (allows cross-tenant access)
WHERE control_measures.organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
)
\`\`\`

### JWT Token Claims

The system relies on Supabase Auth to provide user context, which includes:

- `auth.uid()` - UUID of the authenticated user

**⚠️ CRITICAL:** Supabase JWT tokens do NOT contain custom fields like `tenant_id`, `organization_id`, or `role` by default. These fields are stored in the `users` table, not in JWT claims.

**Previous Incorrect Approach:**
\`\`\`sql
-- ❌ WRONG - JWT doesn't have tenant_id
WHERE control_measures.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
\`\`\`

**Current Correct Approach:**
\`\`\`sql
-- ✅ CORRECT - Get tenant_id from users table
WHERE control_measures.tenant_id IN (
  SELECT tenant_id FROM users WHERE id = auth.uid()
)
\`\`\`

The system now retrieves user context from the `users` table using `auth.uid()` instead of relying on JWT claims. This is implemented in all RLS policies via direct subqueries.

### Locked Measures

Locked measures (`is_locked = true`) are created in **strict mode** and can only be edited by:
- Super admins
- IB managers

This prevents unauthorized modifications to compliance-critical measures.

---

## Testing

### Manual Testing

\`\`\`sql
-- Test as super_admin
SET LOCAL jwt.claims.tenant_id = 'tenant-uuid';
SET LOCAL jwt.claims.organization_id = NULL;
SET LOCAL jwt.claims.role = 'super_admin';

SELECT * FROM control_measures; -- Should see all measures

-- Test as ib_specialist
SET LOCAL jwt.claims.organization_id = 'org-uuid';
SET LOCAL jwt.claims.role = 'ib_specialist';

SELECT * FROM control_measures; -- Should see only own org
UPDATE control_measures SET title = 'Test' WHERE is_locked = true; -- Should fail
\`\`\`

### Automated Testing

Run the end-to-end test script:
\`\`\`bash
psql -f scripts/550_test_measure_creation_flow.sql
\`\`\`

---

## Troubleshooting

### Common Issues

#### Issue: "permission denied for table control_measures"

**Cause:** RLS is enabled but no policies match the user's context.

**Solution:**
1. Check JWT claims are set correctly
2. Verify user exists in `users` table
3. Check `tenant_id` and `organization_id` match

#### Issue: "function get_user_context() does not exist"

**Cause:** Helper function not created.

**Solution:**
\`\`\`bash
psql -f scripts/540_comprehensive_rls_analysis_and_fix.sql
\`\`\`

#### Issue: Locked measures can be edited by ib_specialist

**Cause:** UPDATE policy not checking `is_locked` flag.

**Solution:** Re-run migration script to fix policy.

---

## Migration History

| Version | Date | Script | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-08 | 530_fix_rls_function_final.sql | Initial RLS implementation |
| 2.0 | 2025-01-10 | 540_comprehensive_rls_analysis_and_fix.sql | Added get_user_context(), improved policies |
| 2.1 | 2025-01-10 | 580_fix_rls_use_users_table.sql | **CRITICAL FIX:** Changed policies to query users table instead of JWT |

---

## References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- Data Integrity Model: `docs/data-integrity-model.md`
