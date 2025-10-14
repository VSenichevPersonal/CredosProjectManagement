/**
 * Domain types for Recommendation System
 * Stage 14.4 - Executive Summary
 */

// Recommendation Rule from database
export interface RecommendationRule {
  id: string
  tenantId: string
  
  // Rule metadata
  code: string
  name: string
  description: string | null
  category: RecommendationRuleCategory
  
  // Condition
  conditionType: ConditionType
  conditionField: string
  conditionOperator: ConditionOperator
  conditionValue: number
  
  // Recommendation template
  priority: RecommendationPriority
  titleTemplate: string
  descriptionTemplate: string
  actionTemplate: string
  deadlineDays: number | null
  estimatedBudgetMin: number | null
  estimatedBudgetMax: number | null
  legalBasis: string | null
  
  // Flags
  isActive: boolean
  isSystemRule: boolean
  sortOrder: number
  
  // Audit
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
}

// Generated Recommendation (output)
export interface Recommendation {
  id: string
  ruleId: string
  priority: RecommendationPriority
  category: RecommendationRuleCategory
  
  // Content
  title: string
  description: string
  action: string
  
  // Metadata
  deadline: string | null // Date string or "X дней"
  deadlineDays: number | null
  estimatedBudget: string | null // Formatted range
  legalBasis: string | null
  
  // Related data
  affectedOrganizations?: string[]
  affectedCount?: number
  currentValue?: number
  thresholdValue?: number
  
  // Status
  isActionable: boolean
  confidence: number // 0-100, how confident we are in this recommendation
}

// Dashboard metrics for evaluation
export interface DashboardMetrics {
  // Overall
  overallCompletionRate: number
  criticalCompletionRate: number
  totalRequirements: number
  totalOrganizations: number
  
  // Compliance
  compliantCount: number
  inProgressCount: number
  notStartedCount: number
  overdueCount: number
  
  // Evidence
  evidenceCoverage: number // Percentage of measures with evidence
  totalEvidence: number
  evidenceWithLinks: number
  
  // Regulators
  fstecCompletionRate: number
  fsbCompletionRate: number
  roskomnadzorCompletionRate: number
  
  // Organizations
  orgsWithoutResponsible: number
  weakOrganizations: Array<{
    id: string
    name: string
    completionRate: number
  }>
  
  // Risks
  currentRiskAssessments: number
  criticalRisks: number
  highRisks: number
  
  // Time-based
  lastMonthCompletedCount: number
  lastMonthTrend: number // Positive or negative percentage
}

// Enums
export type RecommendationRuleCategory = 
  | 'critical_requirements'
  | 'overdue'
  | 'missing_responsible'
  | 'evidence_coverage'
  | 'regulator_performance'
  | 'risk_management'
  | 'compliance_process'
  | 'documentation'

export type ConditionType = 
  | 'threshold'
  | 'count'
  | 'percentage'
  | 'boolean'

export type ConditionOperator = 
  | '<'
  | '>'
  | '<='
  | '>='
  | '=='
  | '!='

export type RecommendationPriority = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

// DTOs
export interface CreateRecommendationRuleDTO {
  code: string
  name: string
  description?: string
  category: RecommendationRuleCategory
  
  conditionType: ConditionType
  conditionField: string
  conditionOperator: ConditionOperator
  conditionValue: number
  
  priority: RecommendationPriority
  titleTemplate: string
  descriptionTemplate: string
  actionTemplate: string
  deadlineDays?: number
  estimatedBudgetMin?: number
  estimatedBudgetMax?: number
  legalBasis?: string
  
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateRecommendationRuleDTO extends Partial<CreateRecommendationRuleDTO> {
  id: string
}

// Executive Summary data
export interface ExecutiveSummaryData {
  // Key metrics (big numbers)
  overallCompletionRate: number
  criticalCompletionRate: number
  totalOrganizations: number
  monthlyTrend: number
  
  // Regulator status
  regulatorStatus: Array<{
    name: string
    completionRate: number
    status: 'good' | 'warning' | 'critical'
    requirementsTotal: number
    requirementsCompleted: number
  }>
  
  // Top recommendations
  recommendations: Recommendation[]
  
  // Risk heatmap data
  riskHeatmap: Array<{
    organizationId: string
    organizationName: string
    risks: {
      low: number
      medium: number
      high: number
      critical: number
    }
  }>
  
  // Trend data (last 3 months)
  trendData: Array<{
    month: string
    completed: number
    inProgress: number
    total: number
  }>
  
  // Top problematic organizations
  weakOrganizations: Array<{
    id: string
    name: string
    completionRate: number
    criticalIssues: number
  }>
}

