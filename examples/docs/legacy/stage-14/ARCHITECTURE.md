# Stage 14 Architecture: Continuous Compliance Platform

## System Overview

The IB Compliance Platform has evolved from a requirements registry to a full-featured continuous compliance management system following international SGRC best practices (Vanta, Drata, Secureframe) adapted for Russian regulatory requirements (FSTEC, FSB, Roskomnadzor).

## Core Principles

### 1. Thin Service Layer
Services are thin orchestrators that:
- Validate input
- Check permissions via ExecutionContext
- Delegate to repositories
- Log audit events
- Return domain objects

### 2. ExecutionContext Pattern
All operations flow through ExecutionContext:
\`\`\`typescript
const ctx = await createContext(request)
const result = await SomeService.operation(ctx, params)
\`\`\`

Benefits:
- Automatic tenant isolation
- Permission checking
- Audit logging
- Transaction management

### 3. Repository Pattern
Repositories handle all database operations:
- Supabase client management
- RLS policy enforcement
- Query optimization
- Data mapping

### 4. Domain-Driven Design
Clear separation of concerns:
- `types/domain/` - Domain entities
- `types/dto/` - Data transfer objects
- `services/` - Business logic
- `providers/` - Data access

## Continuous Compliance Architecture

### Hierarchy

\`\`\`
Requirement (Требование)
  ├─ suggested_control_measure_template_ids (Рекомендуемые шаблоны мер)
  ├─ measure_mode: 'flexible' | 'strict'
  └─ Compliance Record (Запись соответствия)
      └─ Control Measures (Меры контроля - instances)
          ├─ allowed_evidence_type_ids (Разрешённые типы доказательств)
          └─ Evidence Links (Связи доказательств)
              └─ Evidence (Доказательства)
\`\`\`

### Key Entities

#### 1. Requirement
- Regulatory requirement from FSTEC/FSB/etc
- Contains `suggested_control_measure_template_ids`
- Has `measure_mode` (flexible/strict)

#### 2. Control Measure Template
- Reusable template for control measures
- Contains `recommended_evidence_type_ids`
- Categorized by type (AC, NS, DP, VM, IR, CA)

#### 3. Compliance Record
- Assignment of requirement to organization
- Auto-creates control measures from templates
- Tracks overall compliance status

#### 4. Control Measure
- Instance of control measure template
- Has `allowed_evidence_type_ids` (copied from template)
- Can be customized if measure_mode is 'flexible'

#### 5. Evidence
- Uploaded document/file
- Has `evidence_type_id`
- Can be linked to multiple measures

#### 6. Evidence Link
- Many-to-many junction table
- Links evidence to control measures
- Enables evidence reusability

## Status Calculation

### Measure Status
\`\`\`typescript
status = (linked_evidence_count >= required_evidence_count) 
  ? 'completed' 
  : 'pending'
\`\`\`

### Compliance Record Status
\`\`\`typescript
status = all_measures_completed 
  ? 'compliant' 
  : 'in_progress'
\`\`\`

### Requirement Status (across all orgs)
\`\`\`typescript
status = {
  total_orgs: count,
  compliant: count_compliant,
  in_progress: count_in_progress,
  not_started: count_not_started
}
\`\`\`

## Service Layer

### ControlMeasureService
\`\`\`typescript
class ControlMeasureService {
  // Create measures from templates
  static async createFromTemplate(
    ctx: ExecutionContext,
    complianceRecordId: string,
    templateId: string
  ): Promise<ControlMeasure>

  // Calculate completion percentage
  static async calculateCompletion(
    ctx: ExecutionContext,
    measureId: string
  ): Promise<number>

  // Get measures with evidence
  static async getWithEvidence(
    ctx: ExecutionContext,
    complianceRecordId: string
  ): Promise<ControlMeasureWithEvidence[]>
}
\`\`\`

### EvidenceLinkService
\`\`\`typescript
class EvidenceLinkService {
  // Link evidence to measure
  static async linkEvidence(
    ctx: ExecutionContext,
    evidenceId: string,
    measureId: string
  ): Promise<EvidenceLink>

  // Get all measures using evidence
  static async getMeasuresForEvidence(
    ctx: ExecutionContext,
    evidenceId: string
  ): Promise<ControlMeasure[]>

  // Bulk link evidence to multiple measures
  static async bulkLink(
    ctx: ExecutionContext,
    evidenceId: string,
    measureIds: string[]
  ): Promise<EvidenceLink[]>
}
\`\`\`

## UI Architecture

### Role-Based Views

#### Administrator View
- Full CRUD on all entities
- Configuration of templates
- Assignment of tasks
- Reporting and analytics

#### Executor View (Simplified)
- "My Tasks" dashboard
- Simple evidence upload
- Status tracking
- No configuration access

### Component Structure

\`\`\`
app/(dashboard)/
  ├─ requirements/[id]/
  │   └─ page.tsx (shows suggested measures)
  ├─ compliance/[id]/
  │   └─ page.tsx (shows actual measures with evidence)
  └─ executor/
      └─ my-tasks/
          └─ page.tsx (simplified view)

components/
  ├─ requirements/
  │   └─ requirement-controls-tab.tsx (suggested measures)
  ├─ compliance/
  │   ├─ control-measure-card.tsx (measure with evidence)
  │   └─ compliance-measures-tab.tsx (all measures)
  ├─ evidence/
  │   ├─ evidence-upload-dialog.tsx (link to measures)
  │   └─ evidence-links-table.tsx (show reuse)
  └─ executor/
      ├─ my-tasks-dashboard.tsx (simplified)
      └─ simple-evidence-upload.tsx (executor view)
\`\`\`

## Security

### Row Level Security (RLS)
All tables have RLS policies:
- Tenant isolation via `tenant_id`
- Role-based access via JWT claims
- No circular dependencies in policies

### Permission Checks
ExecutionContext enforces permissions:
\`\`\`typescript
ctx.requirePermission('compliance:write')
ctx.requireRole('admin')
ctx.requireTenant(tenantId)
\`\`\`

## Performance

### Optimizations
- Materialized views for aggregated evidence types
- Indexes on foreign keys and junction tables
- Batch operations for bulk linking
- Caching of template data

## Migration Strategy

Completed 7-step migration:
1. Add structures
2. Update templates
3. Clear data
4. Update requirements
5. Create test compliance
6. Create test evidence
7. Update RLS

## Next Phase

1. Complete UI implementation
2. Implement status calculation
3. Add bulk operations
4. Implement reporting
5. Add notifications
6. Implement approval workflows
