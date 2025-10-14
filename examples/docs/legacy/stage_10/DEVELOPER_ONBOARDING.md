# Developer Onboarding Guide

## Welcome to the IB Compliance Platform

This guide will help you understand the codebase and start contributing quickly.

## Architecture Overview

### Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript
- **UI:** shadcn/ui, Tailwind CSS v4
- **Backend:** Next.js API Routes, Server Actions
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **AI:** OpenAI, Anthropic (via AI SDK)

### Project Structure

\`\`\`
/app
  /(dashboard)          # Main application pages
  /api                  # API routes
  /auth                 # Authentication pages

/components
  /layout               # Layout components (header, sidebar)
  /ui                   # shadcn/ui components
  /documents            # Document management
  /admin                # Admin panels

/lib
  /context              # ExecutionContext, TenantContext
  /hooks                # React hooks
  /services             # Business logic services
  /providers            # Database providers
  /utils                # Utility functions

/services               # Business logic layer
/providers              # Data access layer
/types                  # TypeScript types
  /domain               # Domain models
  /dto                  # Data transfer objects

/scripts                # Database migrations
/docs                   # Documentation
\`\`\`

### Key Concepts

#### 1. ExecutionContext

All operations flow through ExecutionContext:

\`\`\`typescript
const ctx = await createExecutionContext(request)
const result = await MyService.operation(ctx, params)
\`\`\`

#### 2. Service Layer

Business logic lives in services:

\`\`\`typescript
export class MyService {
  static async operation(ctx: ExecutionContext, params: any) {
    // Check permissions
    await ctx.access.require(Permission.RESOURCE_ACTION)
    
    // Business logic
    const result = await ctx.db.resource.operation(params)
    
    // Audit log
    await ctx.audit.log({ ... })
    
    return result
  }
}
\`\`\`

#### 3. Provider Pattern

Data access through providers:

\`\`\`typescript
interface DatabaseProvider {
  myResources: {
    findMany(filters: any): Promise<MyResource[]>
    findById(id: string): Promise<MyResource | null>
    create(data: any): Promise<MyResource>
    update(id: string, data: any): Promise<MyResource>
    delete(id: string): Promise<void>
  }
}
\`\`\`

## Getting Started

### 1. Setup Development Environment

\`\`\`bash
# Clone repository
git clone <repo-url>
cd ib-compliance-platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run migrations
npm run db:migrate

# Start development server
npm run dev
\`\`\`

### 2. Understanding the Codebase

**Start here:**
1. Read `docs/MULTI_TENANT_ARCHITECTURE.md`
2. Explore `lib/context/execution-context.ts`
3. Look at `services/requirement-service.ts` (example service)
4. Check `app/api/requirements/route.ts` (example API)

**Key files to understand:**
- `lib/context/execution-context.ts` - Core context
- `lib/services/authorization-service.ts` - RBAC
- `providers/supabase-provider.ts` - Database access
- `services/*` - Business logic

### 3. Common Tasks

#### Adding a New Feature

1. **Define types** (`types/domain/my-resource.ts`)
2. **Create service** (`services/my-resource-service.ts`)
3. **Add API route** (`app/api/my-resources/route.ts`)
4. **Create UI** (`components/my-resources/`)
5. **Add tests** (`__tests__/my-resource.test.ts`)

#### Adding a New Permission

1. Add resource in database:
\`\`\`sql
INSERT INTO resources (code, name) VALUES ('my_resource', 'My Resource');
\`\`\`

2. Add permissions:
\`\`\`sql
INSERT INTO permissions (resource_id, action_id, code)
SELECT r.id, a.id, 'my_resource:' || a.code
FROM resources r, actions a
WHERE r.code = 'my_resource';
\`\`\`

3. Use in code:
\`\`\`typescript
await ctx.access.require(Permission.MY_RESOURCE_READ)
\`\`\`

#### Creating a Database Migration

\`\`\`sql
-- scripts/XXX_my_migration.sql

-- Add table
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation"
  ON my_table FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Add index
CREATE INDEX idx_my_table_tenant ON my_table(tenant_id);
\`\`\`

## Code Style Guide

### TypeScript

\`\`\`typescript
// Use explicit types
function myFunction(param: string): Promise<Result> {
  // ...
}

// Use interfaces for objects
interface MyData {
  id: string
  name: string
}

// Use enums for constants
enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
\`\`\`

### React Components

\`\`\`tsx
// Use function components
export function MyComponent({ prop }: MyComponentProps) {
  // Hooks at top
  const [state, setState] = useState()
  const { data } = useSWR('/api/data')
  
  // Event handlers
  const handleClick = () => {
    // ...
  }
  
  // Render
  return <div>...</div>
}

// Export props interface
interface MyComponentProps {
  prop: string
}
\`\`\`

### Services

\`\`\`typescript
/**
 * @intent: What this service does
 * @llm-note: Important context for AI
 * @architecture: How it fits in the system
 */
export class MyService {
  /**
   * @intent: What this method does
   * @precondition: What must be true before calling
   * @postcondition: What will be true after calling
   * @side-effects: What else happens
   */
  static async operation(ctx: ExecutionContext, params: any): Promise<Result> {
    // Implementation
  }
}
\`\`\`

## Testing

### Unit Tests

\`\`\`typescript
import { MyService } from '@/services/my-service'
import { createMockContext } from '@/test/utils'

describe('MyService', () => {
  it('should perform operation', async () => {
    const ctx = createMockContext()
    const result = await MyService.operation(ctx, params)
    expect(result).toBeDefined()
  })
})
\`\`\`

### Integration Tests

\`\`\`typescript
import { createTestTenant, createTestUser } from '@/test/fixtures'

describe('MyService Integration', () => {
  it('should respect tenant isolation', async () => {
    const tenant1 = await createTestTenant()
    const tenant2 = await createTestTenant()
    
    const user1 = await createTestUser(tenant1.id)
    const user2 = await createTestUser(tenant2.id)
    
    // Test isolation
  })
})
\`\`\`

## Debugging

### Enable Debug Logs

\`\`\`typescript
ctx.logger.debug('[v0] My debug message', { data })
\`\`\`

### Check Permissions

\`\`\`typescript
console.log('[v0] User permissions:', ctx.permissions)
console.log('[v0] Can read?', await ctx.access.can('resource', 'read'))
\`\`\`

### Inspect Database

\`\`\`sql
-- Check tenant data
SELECT * FROM my_table WHERE tenant_id = 'xxx';

-- Check permissions
SELECT * FROM role_permissions WHERE role_id = 'xxx';

-- Check audit log
SELECT * FROM audit_logs WHERE user_id = 'xxx' ORDER BY created_at DESC;
\`\`\`

## Best Practices

### DO

- Always use ExecutionContext
- Check permissions before operations
- Log all mutations to audit log
- Use TypeScript types everywhere
- Write JSDoc comments for services
- Test tenant isolation
- Use semantic HTML
- Follow accessibility guidelines

### DON'T

- Don't bypass ExecutionContext
- Don't skip permission checks
- Don't forget audit logging
- Don't use `any` type
- Don't hardcode tenant IDs
- Don't skip RLS policies
- Don't use inline styles
- Don't forget error handling

## Resources

- [Multi-Tenant Architecture](./MULTI_TENANT_ARCHITECTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [RBAC Guide](./RBAC_GUIDE.md)

## Getting Help

- Ask in team chat
- Review existing code
- Check documentation
- Look at similar features
- Pair with senior developer

---

**Welcome to the team!**
