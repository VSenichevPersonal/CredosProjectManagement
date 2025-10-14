export interface OrganizationComplianceReport {
  organization: {
    id: string
    name: string
    type_name: string
  }
  generatedAt: string
  generatedBy: string
  requirements: ComplianceReportRow[]
}

export interface ComplianceReportRow {
  number: number
  requirement: {
    id: string
    title: string
    description: string
    criticality: string
  }
  compliance: {
    id: string | null
    status: string
    answer: "Да" | "Нет" | "Неприменимо"
    notes: string | null
    completedAt: string | null
    reviewedAt: string | null
  }
  legalReferences: LegalReference[]
  evidence: Evidence[]
}

export interface LegalReference {
  id: string
  full_reference: string
  article_number: string
  part: string | null
  paragraph: string | null
  is_primary: boolean
  relevance_note: string | null
}

export interface Evidence {
  id: string
  title: string
  file_path: string
  uploaded_at: string
}
