export type ControlType = "preventive" | "detective" | "corrective"

export type ControlFrequency = "continuous" | "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "on_demand"

export type ControlStatus = "active" | "inactive" | "draft" | "deprecated"

export type TestResult = "passed" | "failed" | "partial" | "not_tested"

export type MappingType = "direct" | "indirect" | "partial"

export interface Control {
  id: string
  tenantId: string

  // Identification
  code: string
  title: string
  description?: string
  category: string

  // Characteristics
  controlType: ControlType
  frequency: ControlFrequency

  // Ownership
  ownerId?: string
  status: ControlStatus

  // Implementation
  implementationGuide?: string
  testingProcedure?: string
  evidenceRequirements?: string[]

  // Metadata
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface ControlMapping {
  id: string
  tenantId: string

  controlId: string
  requirementId: string

  mappingType: MappingType
  coveragePercentage?: number
  mappingNotes?: string

  createdAt: Date
}

export interface ControlTest {
  id: string
  tenantId: string

  controlId: string
  organizationId?: string

  // Test details
  testDate: Date
  testedBy?: string
  testResult: TestResult

  // Findings
  findings?: string
  evidenceIds?: string[]

  // Remediation
  remediationRequired: boolean
  remediationPlan?: string
  remediationDueDate?: Date
  remediationCompletedAt?: Date

  // Next test
  nextTestDate?: Date

  createdAt: Date
  updatedAt: Date
}
