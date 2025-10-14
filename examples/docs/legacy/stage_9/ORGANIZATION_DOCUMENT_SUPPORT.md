# Organization-Level Document Support

## Overview

The system now supports direct association of documents with organizations, enabling proper multi-tenant architecture for networks of subordinate organizations.

## Architecture Changes

### Database Schema

Added `organization_id` column to `evidence` table:
- **Type**: UUID (nullable)
- **References**: `organizations(id)` with CASCADE delete
- **Meaning**: 
  - `NULL` = tenant-wide document (shared across all organizations)
  - `UUID` = organization-specific document

### Indexes

Three new indexes for performance:
1. `idx_evidence_organization_id` - Fast filtering by organization
2. `idx_evidence_tenant_organization` - Combined tenant + organization queries
3. `idx_evidence_org_actuality` - Actuality queries by organization

### Row-Level Security (RLS)

Updated RLS policy `evidence_tenant_isolation`:
- Users see documents from their organization
- Users see tenant-wide documents (organization_id IS NULL)
- Admins and regulators see all documents

## Use Cases

### 1. Ministry-Level View (All Organizations)

\`\`\`typescript
// Get statistics for entire tenant
GET /api/documents/actuality/stats?tenantId=xxx

// Get all documents needing attention
GET /api/documents/actuality/attention?tenantId=xxx
\`\`\`

### 2. Organization-Specific View

\`\`\`typescript
// Get statistics for specific organization
GET /api/documents/actuality/stats?organizationId=yyy

// Get documents needing attention for organization
GET /api/documents/actuality/attention?organizationId=yyy

// List documents filtered by organization
GET /api/documents?organizationId=yyy
\`\`\`

### 3. Creating Documents

\`\`\`typescript
// Tenant-wide document (no organizationId)
POST /api/documents
{
  "fileName": "Federal Policy.pdf",
  "organizationId": null // or omit
}

// Organization-specific document
POST /api/documents
{
  "fileName": "Local Instruction.pdf",
  "organizationId": "org-uuid"
}
\`\`\`

## API Changes

### Updated Endpoints

All document-related endpoints now support `organizationId` parameter:

- `GET /api/documents?organizationId=xxx`
- `GET /api/documents/actuality/stats?organizationId=xxx`
- `GET /api/documents/actuality/attention?organizationId=xxx`

### DTO Updates

`CreateDocumentDTO` now includes:
\`\`\`typescript
{
  organizationId?: string // Optional UUID
}
\`\`\`

`DocumentFiltersDTO` now includes:
\`\`\`typescript
{
  organizationId?: string // Filter by organization
}
\`\`\`

## Service Layer

### DocumentActualityService

Methods updated to support organization filtering:
- `getActualityStatistics(tenantId, organizationId?)`
- `getDocumentsNeedingAttention(userId, tenantId, organizationId?)`

### Access Control

Automatic filtering based on user's organization:
- Regular users: see only their organization's documents + tenant-wide
- Admins/Regulators: see all documents across all organizations

## Migration

Run migration `004_add_organization_to_evidence.sql`:
1. Adds `organization_id` column
2. Populates from existing `compliance_records` relationships
3. Creates indexes
4. Updates RLS policies

## Benefits

1. **Direct Filtering**: No JOIN required for organization queries
2. **Flexible Ownership**: Documents can be org-specific or tenant-wide
3. **Performance**: Indexed queries for large datasets
4. **Security**: RLS ensures proper data isolation
5. **Scalability**: Supports hierarchical organization structures

## Example Scenarios

### Scenario 1: Federal Ministry with Regional Offices

\`\`\`typescript
// Ministry admin sees all documents
const allStats = await service.getActualityStatistics(tenantId)
// Result: 450 documents across 15 regional offices

// Regional office sees only their documents
const regionalStats = await service.getActualityStatistics(tenantId, regionalOfficeId)
// Result: 30 documents for this office
\`\`\`

### Scenario 2: Shared vs Specific Documents

\`\`\`typescript
// Federal policy (shared across all organizations)
{
  organizationId: null,
  title: "Federal Information Security Policy"
}

// Local instruction (specific to one organization)
{
  organizationId: "regional-office-uuid",
  title: "Regional Access Control Procedure"
}
\`\`\`

## Testing

Verify organization filtering:
1. Create documents with different `organizationId` values
2. Query with organization filter
3. Verify RLS policies restrict access correctly
4. Test actuality statistics by organization
