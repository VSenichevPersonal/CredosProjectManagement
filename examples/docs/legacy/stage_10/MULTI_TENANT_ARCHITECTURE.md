# Multi-Tenant Architecture Guide

## Overview

This system implements a **multi-tenant architecture** that allows multiple organizations (tenants) to use the same application instance while keeping their data isolated.

## Architecture Principles

### 1. Data Isolation Strategy

**Tenant-Specific Tables** (with `tenant_id`):
- `users` - Users belong to specific tenants
- `organizations` - Organizations within tenants
- `requirements` - Tenant-specific requirements
- `compliance_records` - Compliance tracking per tenant
- `evidence` - Evidence and documents per tenant
- `document_versions` - Document versions per tenant
- `document_analyses` - AI analyses per tenant

**Global Tables** (without `tenant_id`):
- `tenants` - Tenant registry
- `organization_types` - Standard organization types
- `regulatory_frameworks` - Russian regulatory acts (ФСТЭК, 152-ФЗ, etc.)
- `resources` - RBAC resources
- `actions` - RBAC actions
- `permissions` - RBAC permissions
- `roles` - RBAC roles

### 2. Execution Context Pattern

All business logic flows through `ExecutionContext`:

\`\`\`typescript
interface ExecutionContext {
  user: User | null
  organizationId?: string
  db: DatabaseProvider
  logger: Logger
  audit: AuditService
  access: AccessControlService
  requestId: string
  timestamp: Date
  request: Request
  getSubordinateOrganizations?: () => Promise<string[]>
}
\`\`\`

**Flow:**
\`\`\`
Request → Middleware → ExecutionContext → Service → Provider → Database
\`\`\`

### 3. Service Layer Pattern

All services follow this pattern:

\`\`\`typescript
export class ExampleService {
  static async operation(ctx: ExecutionContext, params: any): Promise<Result> {
    // 1. Check permissions
    await ctx.access.require(Permission.RESOURCE_ACTION)
    
    // 2. Business logic
    const result = await ctx.db.resource.operation(params)
    
    // 3. Audit log
    await ctx.audit.log({
      eventType: "resource_action",
      userId: ctx.user!.id,
      resourceType: "resource",
      resourceId: result.id,
    })
    
    return result
  }
}
\`\`\`

### 4. Provider Pattern

Database providers automatically filter by tenant:

\`\`\`typescript
class SupabaseDatabaseProvider implements DatabaseProvider {
  async findMany(filters: any): Promise<T[]> {
    // Automatically adds tenant_id filter
    return this.supabase
      .from(table)
      .select()
      .eq('tenant_id', this.tenantId)
      .match(filters)
  }
}
\`\`\`

## Implementation Guide

### Adding a New Feature

1. **Define Domain Model** (`types/domain/`)
\`\`\`typescript
export interface MyResource {
  id: string
  tenantId: string  // Required for tenant-specific resources
  name: string
  // ... other fields
}
\`\`\`

2. **Create Service** (`services/`)
\`\`\`typescript
export class MyResourceService {
  static async list(ctx: ExecutionContext): Promise<MyResource[]> {
    await ctx.access.require(Permission.MY_RESOURCE_READ)
    return ctx.db.myResources.findMany()
  }
}
\`\`\`

3. **Create API Route** (`app/api/`)
\`\`\`typescript
export async function GET(request: NextRequest) {
  const ctx = await createExecutionContext(request)
  const resources = await MyResourceService.list(ctx)
  return Response.json({ data: resources })
}
\`\`\`

4. **Create UI Component** (`components/`)
\`\`\`tsx
export function MyResourceList() {
  const { data } = useSWR('/api/my-resources')
  const { can } = useAuthorization()
  
  if (!can('my_resources', 'read')) {
    return <AccessDenied />
  }
  
  return <div>{/* render list */}</div>
}
\`\`\`

### Database Migration

When adding tenant-specific tables:

\`\`\`sql
CREATE TABLE my_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy
CREATE POLICY "Users can access their tenant resources"
  ON my_resources FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Add index
CREATE INDEX idx_my_resources_tenant ON my_resources(tenant_id);
\`\`\`

### RBAC Integration

1. **Add Resource** (if new):
\`\`\`sql
INSERT INTO resources (code, name, description)
VALUES ('my_resources', 'My Resources', 'Custom resources');
\`\`\`

2. **Add Permissions**:
\`\`\`sql
INSERT INTO permissions (resource_id, action_id, code)
SELECT r.id, a.id, 'my_resources:' || a.code
FROM resources r, actions a
WHERE r.code = 'my_resources';
\`\`\`

3. **Assign to Roles**:
\`\`\`sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'super_admin' AND p.code LIKE 'my_resources:%';
\`\`\`

## Tenant Management

### For Single-Tenant Deployment

1. Create one tenant in database
2. All users belong to this tenant
3. Tenant switcher hidden in UI (only shows tenant name)

### For Multi-Tenant SaaS

1. Multiple tenants in database
2. Super admin can switch between tenants
3. Regular users see only their tenant
4. Data completely isolated by tenant_id

### Switching Tenants (Super Admin)

\`\`\`typescript
const { switchTenant } = useTenant()

await switchTenant(newTenantId)
// Page reloads with new tenant context
\`\`\`

## Organization Hierarchy and Access Control

### Overview

The system implements hierarchical organization structure where users can only access their own organization and subordinate organizations. Super admins and regulators have access to all organizations within their tenant.

### Database Schema

#### Organizations Table
\`\`\`sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_id UUID REFERENCES organizations(id),  -- Hierarchical structure
  name TEXT NOT NULL,
  -- ... other fields
);

-- Index for hierarchy queries
CREATE INDEX idx_organizations_parent ON organizations(parent_id);
\`\`\`

#### Users Table
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID REFERENCES organizations(id),  -- NULLABLE
  role TEXT NOT NULL,
  -- ... other fields
);
\`\`\`

**Important:** `organization_id` is **nullable** to support super_admin and regulator roles who need to see all organizations.

### SQL Functions

#### get_subordinate_organizations
Returns all subordinate organization IDs for a given organization:

\`\`\`sql
CREATE FUNCTION get_subordinate_organizations(org_id UUID)
RETURNS TABLE(id UUID) AS $$
  WITH RECURSIVE subordinates AS (
    SELECT id, parent_id FROM organizations WHERE id = org_id
    UNION ALL
    SELECT o.id, o.parent_id
    FROM organizations o
    INNER JOIN subordinates s ON o.parent_id = s.id
  )
  SELECT id FROM subordinates;
$$ LANGUAGE SQL;
\`\`\`

#### can_access_organization
Checks if user can access specific organization:

\`\`\`sql
CREATE FUNCTION can_access_organization(
  p_user_id UUID,
  p_organization_id UUID
) RETURNS BOOLEAN AS $$
  -- Returns TRUE if:
  -- 1. User is super_admin or regulator
  -- 2. Organization is user's own
  -- 3. Organization is subordinate to user's organization
$$ LANGUAGE plpgsql;
\`\`\`

### TypeScript Implementation

#### Extended User Interface
\`\`\`typescript
interface ExtendedUser {
  id: string
  tenantId: string
  organizationId?: string  // Optional for super_admin/regulator
  role: string
  subordinateOrganizationIds: string[]  // Loaded from DB
}
\`\`\`

#### Access Control Functions

**getAccessibleOrganizationIds:**
\`\`\`typescript
function getAccessibleOrganizationIds(user: ExtendedUser): string[] | "all" {
  // Super admin and regulator see all
  if (user.role === "super_admin" || user.role === "regulator") {
    return "all"
  }
  
  // User without organization sees nothing
  if (!user.organizationId) {
    return []
  }
  
  // User sees own + subordinates
  return [user.organizationId, ...user.subordinateOrganizationIds]
}
\`\`\`

**canAccessOrganization:**
\`\`\`typescript
function canAccessOrganization(
  user: ExtendedUser,
  organizationId: string
): boolean {
  const accessibleIds = getAccessibleOrganizationIds(user)
  return accessibleIds === "all" || accessibleIds.includes(organizationId)
}
\`\`\`

### API Implementation Pattern

All API endpoints that return organization-specific data must filter by accessible organizations:

\`\`\`typescript
export async function GET(request: NextRequest) {
  // 1. Get current user with subordinate organizations
  const user = await getCurrentUser()
  
  // 2. Get accessible organization IDs
  const accessibleIds = getAccessibleOrganizationIds(user)
  
  // 3. Build query with tenant filter
  let query = supabase
    .from("table")
    .eq("tenant_id", user.tenantId)
  
  // 4. Add organization filter if not super_admin/regulator
  if (accessibleIds !== "all") {
    if (accessibleIds.length === 0) {
      return Response.json({ data: [] })
    }
    query = query.in("organization_id", accessibleIds)
  }
  
  // 5. Execute query
  const { data } = await query
  return Response.json({ data })
}
\`\`\`

### Access Rules Summary

| Role | Organization Required | Can Access |
|------|----------------------|------------|
| super_admin | No (optional) | All organizations in tenant |
| regulator | No (optional) | All organizations in tenant |
| compliance_officer | Yes | Own + subordinate organizations |
| auditor | Yes | Own + subordinate organizations |
| user | Yes | Own + subordinate organizations |

### Security Considerations

1. **Always load subordinate organizations** in `getCurrentUser()`
2. **Always filter by accessible organizations** in API endpoints
3. **Check access before mutations** using `canAccessOrganization()`
4. **Validate organization_id** in request body matches accessible list
5. **Log access attempts** for audit trail

### Migration Guide

When adding organization filtering to existing endpoints:

1. Import helper functions:
\`\`\`typescript
import { getCurrentUser } from "@/lib/auth/get-user"
import { getAccessibleOrganizationIds } from "@/lib/auth/get-accessible-organizations"
\`\`\`

2. Get user and accessible IDs:
\`\`\`typescript
const user = await getCurrentUser()
const accessibleIds = getAccessibleOrganizationIds(user)
\`\`\`

3. Add filter to query:
\`\`\`typescript
if (accessibleIds !== "all") {
  query = query.in("organization_id", accessibleIds)
}
\`\`\`

4. Test with different roles:
   - Super admin should see all
   - User with organization should see own + subordinates
   - User without organization should see nothing

### Performance Optimization

1. **Index on parent_id** for fast hierarchy traversal
2. **Cache subordinate IDs** in user session
3. **Use IN clause** instead of multiple OR conditions
4. **Limit recursion depth** in get_subordinate_organizations (max 10 levels)

### Testing

Test cases to cover:

1. Super admin sees all organizations
2. Regulator sees all organizations
3. User sees own organization
4. User sees subordinate organizations
5. User cannot see parent organization
6. User cannot see sibling organizations
7. User without organization sees nothing
8. Cross-tenant access is blocked

## Security Considerations

### Row Level Security (RLS)

All tenant-specific tables MUST have RLS policies:

\`\`\`sql
-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
CREATE POLICY "tenant_isolation_select"
  ON my_table FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy for INSERT
CREATE POLICY "tenant_isolation_insert"
  ON my_table FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);
\`\`\`

### Permission Checks

Always check permissions in services:

\`\`\`typescript
// Required permission
await ctx.access.require(Permission.RESOURCE_ACTION)

// Optional check
if (await ctx.access.can('resource', 'action')) {
  // Allow operation
}

// Organization access
if (await ctx.access.canAccessOrganization(orgId)) {
  // Allow access
}
\`\`\`

### Audit Logging

All mutations MUST be logged:

\`\`\`typescript
await ctx.audit.log({
  eventType: 'resource_created',
  userId: ctx.user!.id,
  resourceType: 'resource',
  resourceId: resource.id,
  changes: data,
})
\`\`\`

## Testing

### Unit Tests

Test services with mock ExecutionContext:

\`\`\`typescript
const mockCtx: ExecutionContext = {
  user: { id: 'user-1', tenantId: 'tenant-1' },
  db: mockDatabaseProvider,
  access: mockAccessControl,
  // ... other fields
}

const result = await MyService.operation(mockCtx, params)
\`\`\`

### Integration Tests

Test with real database and tenant isolation:

\`\`\`typescript
// Create test tenant
const tenant = await createTestTenant()

// Create test user in tenant
const user = await createTestUser(tenant.id)

// Test operation
const ctx = await createExecutionContext(user)
const result = await MyService.operation(ctx, params)

// Verify tenant isolation
expect(result.tenantId).toBe(tenant.id)
\`\`\`

## Performance Optimization

### Caching

Cache tenant data and permissions:

\`\`\`typescript
// Cache permissions in memory
const permissionsCache = new Map<string, string[]>()

// Cache tenant info
const tenantCache = new Map<string, Tenant>()
\`\`\`

### Database Indexes

Ensure indexes on tenant_id:

\`\`\`sql
CREATE INDEX idx_table_tenant ON table(tenant_id);
CREATE INDEX idx_table_tenant_created ON table(tenant_id, created_at DESC);
\`\`\`

### Query Optimization

Use selective queries:

\`\`\`typescript
// Good: Filter by tenant_id first
.eq('tenant_id', tenantId)
.eq('status', 'active')

// Bad: Full table scan
.eq('status', 'active')
.eq('tenant_id', tenantId)
\`\`\`

## Migration from Single to Multi-Tenant

If you need to migrate existing single-tenant data:

1. **Add tenant_id column**:
\`\`\`sql
ALTER TABLE my_table ADD COLUMN tenant_id UUID;
\`\`\`

2. **Create default tenant**:
\`\`\`sql
INSERT INTO tenants (id, name, slug)
VALUES (gen_random_uuid(), 'Default Tenant', 'default');
\`\`\`

3. **Migrate data**:
\`\`\`sql
UPDATE my_table
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'default');
\`\`\`

4. **Add constraint**:
\`\`\`sql
ALTER TABLE my_table
ALTER COLUMN tenant_id SET NOT NULL,
ADD CONSTRAINT fk_my_table_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
\`\`\`

## Support

For questions or issues:
1. Check this documentation
2. Review code comments (all services have JSDoc)
3. Check audit logs for debugging
4. Contact development team

---

**Last Updated:** 2025-01-10
**Version:** 1.0
**Maintainer:** Development Team
