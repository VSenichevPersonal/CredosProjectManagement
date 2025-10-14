export type EvidenceStatus = "pending" | "approved" | "rejected" | "archived"

export type DocumentLifecycle = "draft" | "active" | "archived" | "destroyed"

export type EvidenceType =
  | "document"
  | "screenshot"
  | "log"
  | "certificate"
  | "report"
  | "scan"
  | "video"
  | "audio"
  | "archive"
  | "other"

export interface DocumentMetadata {
  pages?: number
  language?: string
  author?: string
}

export interface CertificateMetadata {
  issuer: string
  validUntil: Date
  serialNumber: string
  algorithm?: string
}

export interface ScreenshotMetadata {
  resolution?: string
  capturedFrom?: string
  capturedAt?: Date
}

export interface LogMetadata {
  logLevel?: string
  source?: string
  lineCount?: number
  dateRange?: { from: Date; to: Date }
}

export interface ReportMetadata {
  reportType?: string
  period?: string
  generatedBy?: string
}

export type EvidenceTypeMetadata =
  | DocumentMetadata
  | CertificateMetadata
  | ScreenshotMetadata
  | LogMetadata
  | ReportMetadata
  | Record<string, unknown>

export interface Evidence {
  id: string
  tenantId: string

  organizationId?: string

  // Relations (kept for backward compatibility, but prefer using controlMeasures array)
  complianceRecordId?: string
  requirementId?: string
  controlId?: string

  // Content: ЛИБО file, ЛИБО document
  // File information (если это файл)
  fileName?: string
  fileUrl?: string
  fileType?: string
  fileSize?: number
  storagePath?: string

  // Document reference (если это документ)
  documentId?: string

  evidenceTypeId?: string

  // Evidence type and metadata
  evidenceType: EvidenceType
  typeMetadata?: EvidenceTypeMetadata

  // Metadata
  title?: string
  description?: string
  tags?: string[]

  // Status tracking
  status: EvidenceStatus
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: Date

  // Upload tracking
  uploadedBy: string
  uploadedAt: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date

  controlMeasures?: Array<{
    id: string
    title: string
    status: string
    linkNotes?: string
    relevanceScore?: number
  }>

  evidenceTypeDetails?: {
    id: string
    code: string
    title: string
    description?: string
  }
}

export interface EvidenceLink {
  id: string
  tenantId: string
  evidenceId: string
  controlMeasureId?: string
  requirementId?: string
  linkNotes?: string
  relevanceScore?: number
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface ControlEvidence {
  id: string
  tenantId: string
  controlId: string
  evidenceId: string
  organizationId?: string
  notes?: string
  createdBy?: string
  createdAt: Date
}
