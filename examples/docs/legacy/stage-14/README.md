# Stage 14: Continuous Compliance Architecture

## Overview

Stage 14 represents a fundamental architectural shift from a **requirements registry** to a **continuous compliance platform** following SGRC (Security, Governance, Risk, and Compliance) best practices adapted for Russian regulatory requirements.

## Key Changes

### 1. New Architecture: Requirement → Control → Evidence

**Previous (Stage 13):**
\`\`\`
Requirement → Evidence Types → Evidence
\`\`\`

**Current (Stage 14):**
\`\`\`
Requirement → Control Measure Templates → Control Measures → Evidence Types → Evidence
\`\`\`

### 2. Evidence Reusability

- Introduced `evidence_links` junction table
- One evidence document can prove multiple control measures
- Supports many-to-many relationships

### 3. Continuous Compliance Model

- No fixed due dates for compliance checks
- Real-time status calculation based on evidence presence
- Automatic status aggregation: measure → requirement → organization

### 4. Flexible vs Strict Modes

Requirements now have `measure_mode`:
- **Flexible**: Organizations can add custom control measures
- **Strict**: Only predefined measures from templates allowed

## Database Changes

### New Tables
- `evidence_links` - Many-to-many junction for evidence reuse

### Modified Tables
- `control_measure_templates` - Added `recommended_evidence_type_ids`
- `requirements` - Added `measure_mode` enum
- `control_measures` - Added `allowed_evidence_type_ids`

## Service Layer

### New Services
- `ControlMeasureService` - Manage control measures lifecycle
- `EvidenceLinkService` - Manage evidence-to-measure links

### Updated Services
- `ComplianceService` - Auto-create measures from templates
- `EvidenceService` - Support evidence_links
- `RequirementService` - Load with suggested measures

## UI Changes

### Role-Based Interface

**Administrator/CISO View:**
- Full control over requirements, measures, evidence types
- Can configure templates and assign tasks
- Complex interface with all features

**Executor View (Simplified):**
- "My Tasks" dashboard
- Simple evidence upload workflow
- No access to configuration

### Component Updates
- Requirement detail page shows suggested measures
- Compliance record page shows actual measures with evidence
- Evidence upload links to specific measures

## Migration

Completed 7-step migration:
1. Add new structures (evidence_links, columns)
2. Update measure templates with evidence types
3. Clear old data
4. Update requirements with suggested measures
5. Create test compliance records
6. Create test evidence and links
7. Update RLS policies

## Next Steps

1. Complete UI implementation for new architecture
2. Implement simplified executor interface
3. Add bulk evidence linking
4. Implement status calculation and aggregation
5. Add reporting for continuous compliance

## References

- [Architecture Details](./ARCHITECTURE.md)
- [Continuous Compliance Guide](./CONTINUOUS_COMPLIANCE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Reference](./API_REFERENCE.md)
- [Reference Book Pattern](./reference-book-pattern.md)
