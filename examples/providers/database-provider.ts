import type { Requirement } from "@/types/domain/requirement"
import type { Organization } from "@/types/domain/organization"
import type { Compliance } from "@/types/domain/compliance"
import type { User } from "@/types/domain/user"
import type { Evidence } from "@/types/domain/evidence"
import type { ControlEvidence } from "@/types/domain/evidence"
import type { RequirementFilters } from "@/types/dto/requirement-dto"
import type { ComplianceFilters } from "@/types/dto/compliance-dto"
import type {
  RequirementApplicabilityRule,
  RequirementOrganizationMapping,
  ApplicabilityFilterRules,
} from "@/types/domain/applicability"
import type { RegulatoryFramework } from "@/types/domain/regulatory-framework"
import type { OrganizationRequirementsResult } from "@/types/domain/organization-requirements-result"
import type { OrganizationType } from "@/types/domain/organization-type"
import type { Control } from "@/types/domain/control"
import type { RequirementControl } from "@/types/domain/requirement-control"
import type { OrganizationControl } from "@/types/domain/organization-control"
import type { Document, DocumentVersion, DocumentAnalysis, DocumentDiff } from "@/types/domain/document"
import type {
  ControlTemplate,
  RequirementControlTemplate,
  TemplateRecommendation,
} from "@/types/domain/control-template"
import type { EvidenceType, ControlMeasureTemplate, ControlMeasureEvidence } from "@/types/domain/control-measure"
import type { Risk, RiskMitigation, CreateRiskDTO, CreateMitigationDTO } from "@/types/domain/risk"
import type { RequirementLegalReference } from "@/types/domain/requirement-legal-reference"

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: Date
}

export interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
}

export interface DatabaseProvider {
  // query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> // REMOVED

  requirements: {
    findMany(filters?: RequirementFilters): Promise<Requirement[]>
    findById(id: string): Promise<Requirement | null>
    create(data: any): Promise<Requirement>
    update(id: string, data: any): Promise<Requirement>
    delete(id: string): Promise<void>
  }

  regulatoryFrameworks: {
    findMany(): Promise<RegulatoryFramework[]>
    findById(id: string): Promise<RegulatoryFramework | null>
    create(data: any): Promise<RegulatoryFramework>
    update(id: string, data: any): Promise<RegulatoryFramework>
    delete(id: string): Promise<void>
  }

  organizationTypes: {
    findMany(filters?: { isActive?: boolean }): Promise<OrganizationType[]>
    findById(id: string): Promise<OrganizationType | null>
    create(data: any): Promise<OrganizationType>
    update(id: string, data: any): Promise<OrganizationType>
    delete(id: string): Promise<void>
  }

  organizations: {
    findMany(): Promise<Organization[]>
    findById(id: string): Promise<Organization | null>
    findHierarchy(rootId: string): Promise<Organization[]>
    getAll(filters?: { parent_id?: string; level?: number; tenant_id?: string }): Promise<Organization[]>
    create(data: any): Promise<Organization>
    update(id: string, data: any): Promise<Organization>
  }

  compliance: {
    findMany(filters?: ComplianceFilters): Promise<Compliance[]>
    findById(id: string): Promise<Compliance | null>
    findByOrganization(orgId: string): Promise<Compliance[]>
    create(data: any): Promise<Compliance>
    update(id: string, data: any): Promise<Compliance>
    createMany(data: any[]): Promise<void>
  }

  users: {
    getAll(options?: { filters?: { role?: string; organization_id?: string } }): Promise<User[]>
    findById(id: string): Promise<User | null>
    findByEmail(email: string): Promise<User | null>
    create(data: any): Promise<User>
    update(id: string, data: any): Promise<User>
  }

  evidence: {
    findMany(filters?: any): Promise<Evidence[]>
    findById(id: string): Promise<Evidence | null>
    findByCompliance(complianceId: string): Promise<Evidence[]>
    findByControl(controlId: string): Promise<Evidence[]>
    create(data: any): Promise<Evidence>
    update(id: string, data: any): Promise<Evidence>
    delete(id: string): Promise<void>
  }

  applicability: {
    getRule(requirementId: string): Promise<RequirementApplicabilityRule | null>
    upsertRule(data: {
      requirementId: string
      ruleType: "automatic" | "manual"
      filterRules: ApplicabilityFilterRules | null
      createdBy: string | null
    }): Promise<RequirementApplicabilityRule>
    getMappings(requirementId: string): Promise<RequirementOrganizationMapping[]>
    createMapping(data: {
      requirementId: string
      organizationId: string
      mappingType: "automatic" | "manual_include" | "manual_exclude"
      reason: string | null
      createdBy: string | null
    }): Promise<RequirementOrganizationMapping>
    upsertMapping(data: {
      requirementId: string
      organizationId: string
      mappingType: "automatic" | "manual_include" | "manual_exclude"
      reason: string | null
      createdBy: string | null
    }): Promise<RequirementOrganizationMapping>
    deleteMapping(id: string): Promise<void>
  }

  organizationRequirements: {
    getRequirements(organizationId: string): Promise<OrganizationRequirementsResult>
    addManualRequirement(organizationId: string, requirementId: string, reason: string, userId: string): Promise<void>
    removeManualRequirement(organizationId: string, requirementId: string): Promise<void>
    addRequirementsByFilter(
      organizationId: string,
      filters: RequirementFilters,
      reason: string,
      userId: string,
    ): Promise<number>
  }

  controls: {
    findMany(filters?: { category?: string; controlType?: string; status?: string }): Promise<Control[]>
    findById(id: string): Promise<Control | null>
    create(data: any): Promise<Control>
    update(id: string, data: any): Promise<Control>
    delete(id: string): Promise<void>
  }

  requirementControls: {
    findByRequirement(requirementId: string): Promise<RequirementControl[]>
    findByControl(controlId: string): Promise<RequirementControl[]>
    create(data: {
      requirementId: string
      controlId: string
      mappingType: "direct" | "indirect" | "partial"
      coveragePercentage?: number
      mappingNotes?: string
      isOptional?: boolean // Added is_optional parameter
      createdBy?: string
    }): Promise<RequirementControl>
    delete(id: string): Promise<void>
  }

  organizationControls: {
    findByOrganization(organizationId: string): Promise<OrganizationControl[]>
    findByControl(controlId: string): Promise<OrganizationControl[]>
    upsert(data: {
      organizationId: string
      controlId: string
      implementationStatus: string
      implementationDate?: Date
      verificationDate?: Date
      nextReviewDate?: Date
      responsibleUserId?: string
      verifierUserId?: string
      implementationNotes?: string
      verificationNotes?: string
      createdBy?: string
    }): Promise<OrganizationControl>
    delete(id: string): Promise<void>
  }

  controlEvidence: {
    findByControl(controlId: string): Promise<ControlEvidence[]>
    findByEvidence(evidenceId: string): Promise<ControlEvidence[]>
    create(data: {
      controlId: string
      evidenceId: string
      organizationId?: string
      notes?: string
      createdBy?: string
    }): Promise<ControlEvidence>
    delete(id: string): Promise<void>
  }

  documents: {
    findMany(filters?: any): Promise<Document[]>
    findById(id: string): Promise<Document | null>
    findExpiring(withinDays: number): Promise<Document[]>
    create(data: any): Promise<Document>
    update(id: string, data: any): Promise<Document>
    delete(id: string): Promise<void>
  }

  documentVersions: {
    findByDocument(documentId: string): Promise<DocumentVersion[]>
    findById(id: string): Promise<DocumentVersion | null>
    create(data: any): Promise<DocumentVersion>
    update(id: string, data: any): Promise<DocumentVersion>
    delete(id: string): Promise<void>
  }

  documentAnalyses: {
    findByDocument(documentId: string): Promise<DocumentAnalysis[]>
    findById(id: string): Promise<DocumentAnalysis | null>
    create(data: any): Promise<DocumentAnalysis>
    update(id: string, data: any): Promise<DocumentAnalysis>
  }

  documentDiffs: {
    findByVersions(fromVersionId: string | null, toVersionId: string, diffType: string): Promise<DocumentDiff | null>
    create(data: any): Promise<DocumentDiff>
  }

  controlTemplates: {
    findMany(filters?: any): Promise<ControlTemplate[]>
    findById(id: string): Promise<ControlTemplate | null>
    findByRequirement(requirementId: string): Promise<TemplateRecommendation[]>
    create(data: any): Promise<ControlTemplate>
    update(id: string, data: any): Promise<ControlTemplate>
    delete(id: string): Promise<void>
  }

  requirementControlTemplates: {
    findByRequirement(requirementId: string): Promise<RequirementControlTemplate[]>
    findByTemplate(templateId: string): Promise<RequirementControlTemplate[]>
    create(data: {
      requirementId: string
      controlTemplateId: string
      priority?: number
      rationale?: string
      createdBy?: string
    }): Promise<RequirementControlTemplate>
    delete(id: string): Promise<void>
  }

  evidenceTypes: {
    findMany(filters?: { isActive?: boolean }): Promise<EvidenceType[]>
    findById(id: string): Promise<EvidenceType | null>
    create(data: any): Promise<EvidenceType>
    update(id: string, data: any): Promise<EvidenceType>
    delete(id: string): Promise<void>
  }

  controlMeasureTemplates: {
    findMany(filters?: { isActive?: boolean; category?: string }): Promise<ControlMeasureTemplate[]>
    findById(id: string): Promise<ControlMeasureTemplate | null>
    findByRequirement(requirementId: string): Promise<ControlMeasureTemplate[]>
    create(data: any): Promise<ControlMeasureTemplate>
    update(id: string, data: any): Promise<ControlMeasureTemplate>
    delete(id: string): Promise<void>
  }

  controlMeasureEvidence: {
    findByControlMeasure(controlMeasureId: string): Promise<ControlMeasureEvidence[]>
    findByEvidence(evidenceId: string): Promise<ControlMeasureEvidence[]>
    link(data: {
      controlMeasureId: string
      evidenceId: string
      notes?: string
      relevanceScore?: number
      createdBy?: string
    }): Promise<ControlMeasureEvidence>
    unlink(controlMeasureId: string, evidenceId: string): Promise<void>
    updateLink(
      controlMeasureId: string,
      evidenceId: string,
      data: { notes?: string; relevanceScore?: number },
    ): Promise<ControlMeasureEvidence>
  }

  notifications: {
    findMany(filters?: { userId?: string; isRead?: boolean }): Promise<Notification[]>
    findById(id: string): Promise<Notification | null>
    findByDeadline(complianceRecordId: string, daysUntilDeadline: number): Promise<Notification | null>
    create(data: {
      userId: string
      title: string
      message: string
      type: string
      metadata?: Record<string, any>
    }): Promise<Notification>
    markAsRead(id: string): Promise<void>
    delete(id: string): Promise<void>
  }

  complianceRecords: {
    findMany(filters?: any): Promise<Compliance[]>
    findById(id: string): Promise<Compliance | null>
    findByReviewDate(targetDate: Date): Promise<Compliance[]>
    create(data: any): Promise<Compliance>
    update(id: string, data: any): Promise<Compliance>
  }

  risks: {
    findMany(filters?: { organizationId?: string; status?: string; riskLevel?: string }): Promise<Risk[]>
    findById(id: string): Promise<Risk | null>
    findByOrganization(organizationId: string): Promise<Risk[]>
    create(data: CreateRiskDTO): Promise<Risk>
    update(id: string, data: Partial<Risk>): Promise<Risk>
    delete(id: string): Promise<void>
  }

  riskMitigations: {
    findByRisk(riskId: string): Promise<RiskMitigation[]>
    create(data: CreateMitigationDTO): Promise<RiskMitigation>
    update(id: string, data: Partial<RiskMitigation>): Promise<RiskMitigation>
    delete(id: string): Promise<void>
  }

  requirementLegalReferences: {
    findByRequirement(requirementId: string): Promise<RequirementLegalReference[]>
    create(data: {
      requirementId: string
      legalArticleId: string
      isPrimary?: boolean
      relevanceNote?: string
    }): Promise<RequirementLegalReference>
    update(
      id: string,
      data: {
        isPrimary?: boolean
        relevanceNote?: string
      },
    ): Promise<RequirementLegalReference>
    delete(id: string): Promise<void>
  }
}

let providerInstance: DatabaseProvider | null = null

export async function getDatabaseProvider(useServiceRole = false): Promise<DatabaseProvider> {
  // Use dynamic import instead of require for edge runtime compatibility
  if (!providerInstance || useServiceRole) {
    const { SupabaseDatabaseProvider } = await import("./supabase-provider")
    return new SupabaseDatabaseProvider(useServiceRole)
  }
  return providerInstance
}

export function setDatabaseProvider(provider: DatabaseProvider) {
  providerInstance = provider
}
