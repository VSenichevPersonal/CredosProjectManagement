import type { DocumentType, ConfidentialityLevel } from "./document-type"
import type { DocumentLifecycle } from "./evidence"

// Document - отдельная сущность (НЕ extends Evidence!)
export interface Document {
  id: string
  tenantId: string
  organizationId?: string
  
  // Классификация
  documentTypeId: string
  templateId?: string
  
  // Основная информация
  title: string
  description?: string
  
  // Реквизиты (российская специфика)
  documentNumber?: string
  documentDate?: Date
  
  // Версионирование
  currentVersionId?: string
  
  // Жизненный цикл
  lifecycleStatus: DocumentLifecycle
  
  // Утверждение
  approvedBy?: string
  approvedAt?: Date
  
  // Период действия
  effectiveFrom?: Date
  effectiveUntil?: Date
  
  // Пересмотр
  validityPeriodDays?: number
  nextReviewDate?: Date
  lastReviewedAt?: Date
  lastReviewedBy?: string
  reviewNotes?: string
  
  // Хранение
  retentionPeriodYears?: number
  destructionDate?: Date
  nomenclatureItemId?: string
  
  // Конфиденциальность
  confidentialityLevel: ConfidentialityLevel
  
  // Владение
  ownerId?: string
  
  // Audit
  createdBy: string
  createdAt: Date
  updatedAt: Date
  
  // Relations (loaded separately)
  documentType?: DocumentType
  currentVersion?: DocumentVersion
  versions?: DocumentVersion[]
  analyses?: DocumentAnalysis[]
  approvals?: DocumentApproval[]
  evidenceUsages?: EvidenceUsage[]  // Где используется как доказательство
}

export interface EvidenceUsage {
  evidenceId: string
  complianceRecordId?: string
  requirementId?: string
  controlMeasureId?: string
  title: string
  createdAt: Date
}

export type DocumentStatus = "ok" | "needs_update" | "expired" | "not_relevant"

// Approval types
export type ApprovalStatus = "pending" | "in_progress" | "approved" | "rejected" | "cancelled"
export type WorkflowType = "serial" | "parallel"

export interface DocumentApproval {
  id: string
  tenantId: string
  documentId: string
  versionId?: string
  
  workflowType: WorkflowType
  requiredApprovers: string[]
  currentStep: number
  totalSteps: number
  
  status: ApprovalStatus
  
  approvedBy: string[]
  rejectedBy?: string
  rejectionReason?: string
  
  dueDate?: Date
  escalationSent: boolean
  
  createdBy: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  
  // Relations
  steps?: DocumentApprovalStep[]
}

export interface DocumentApprovalStep {
  id: string
  approvalId: string
  
  stepNumber: number
  approverId: string
  approverRole?: string
  
  status: ApprovalStatus
  comments?: string
  
  notifiedAt?: Date
  viewedAt?: Date
  approvedAt?: Date
  
  // Relations
  approver?: {
    id: string
    fullName: string
    email: string
  }
}

export interface DocumentVersion {
  id: string
  tenantId: string
  documentId: string

  // Version info
  versionNumber: string // v1.0, v1.1, v2.0
  majorVersion: number
  minorVersion: number

  // File info
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  storagePath: string

  // Metadata
  changeSummary?: string
  changeNotes?: string

  // Tracking
  createdBy: string
  createdAt: Date

  // Status
  isCurrent: boolean
}

export interface DocumentAnalysis {
  id: string
  tenantId: string
  documentId: string
  fromVersionId?: string
  toVersionId: string

  // Analysis results
  summary: string
  criticalChanges?: CriticalChange[]
  impactAssessment?: string
  recommendations?: Recommendation[]

  // LLM metadata
  llmProvider: LLMProvider
  llmModel: string
  tokensUsed?: number
  processingTimeMs?: number

  // Status
  status: AnalysisStatus
  errorMessage?: string

  createdAt: Date
  completedAt?: Date

  // Relations
  fromVersion?: DocumentVersion
  toVersion?: DocumentVersion
}

export type LLMProvider = "openai" | "anthropic" | "grok" | "local"
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed"

export interface CriticalChange {
  type: "addition" | "deletion" | "modification"
  section: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  lineNumber?: number
}

export interface Recommendation {
  priority: "low" | "medium" | "high"
  action: string
  deadline?: string
  relatedDocuments?: string[]
}

export interface DocumentDiff {
  id: string
  tenantId: string
  documentId: string
  fromVersionId?: string
  toVersionId: string

  // Diff data
  diffType: DiffType
  diffData: DiffChange[]
  diffHtml?: string

  // Statistics
  additionsCount: number
  deletionsCount: number
  modificationsCount: number

  createdAt: Date

  // Relations
  fromVersion?: DocumentVersion
  toVersion?: DocumentVersion
}

export type DiffType = "text" | "visual" | "semantic"

export interface DiffChange {
  type: "add" | "delete" | "modify"
  lineNumber: number
  content: string
  oldContent?: string
}
