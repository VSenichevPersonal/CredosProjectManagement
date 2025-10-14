export type RiskLikelihood = "very_low" | "low" | "medium" | "high" | "very_high"
export type RiskImpact = "very_low" | "low" | "medium" | "high" | "very_high"
export type RiskLevel = "low" | "medium" | "high" | "critical"
export type RiskStatus = "identified" | "assessed" | "mitigating" | "accepted" | "closed"
export type MitigationStrategy = "avoid" | "mitigate" | "transfer" | "accept"
export type MitigationStatus = "planned" | "in_progress" | "completed" | "cancelled"

export interface RiskCategory {
  id: string
  name: string
  description: string | null
  color: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Risk {
  id: string
  organizationId: string
  requirementId: string | null
  categoryId: string | null
  title: string
  description: string | null
  likelihood: RiskLikelihood
  impact: RiskImpact
  riskScore: number
  riskLevel: RiskLevel
  status: RiskStatus
  ownerId: string | null
  identifiedDate: Date
  reviewDate: Date | null
  closedDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface RiskMitigation {
  id: string
  riskId: string
  title: string
  description: string | null
  strategy: MitigationStrategy
  status: MitigationStatus
  responsibleId: string | null
  startDate: Date | null
  targetDate: Date | null
  completionDate: Date | null
  residualLikelihood: RiskLikelihood | null
  residualImpact: RiskImpact | null
  costEstimate: number | null
  actualCost: number | null
  createdAt: Date
  updatedAt: Date
}

export interface RiskAssessment {
  id: string
  riskId: string
  assessedBy: string | null
  assessmentDate: Date
  likelihood: RiskLikelihood
  impact: RiskImpact
  notes: string | null
  createdAt: Date
}

export interface CreateRiskDTO {
  organizationId: string
  requirementId?: string
  categoryId?: string
  title: string
  description?: string
  likelihood: RiskLikelihood
  impact: RiskImpact
  ownerId?: string
  identifiedDate?: Date
}

export interface CreateMitigationDTO {
  riskId: string
  title: string
  description?: string
  strategy: MitigationStrategy
  responsibleId?: string
  startDate?: Date
  targetDate?: Date
  costEstimate?: number
}
