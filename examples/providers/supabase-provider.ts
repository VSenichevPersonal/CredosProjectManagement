import type { SupabaseClient } from "@supabase/supabase-js"
import type { DatabaseProvider } from "./database-provider"
import { logger } from "@/lib/logger"
import { createServiceRoleClient } from "@/lib/supabase/server"

import { OrganizationRepository } from "./supabase/repositories/organization-repository"
import { UserRepository } from "./supabase/repositories/user-repository"
import { RequirementRepository } from "./supabase/repositories/requirement-repository"
import { EvidenceRepository } from "./supabase/repositories/evidence-repository"
import { ComplianceRepository } from "./supabase/repositories/compliance-repository"
import { ControlRepository } from "./supabase/repositories/control-repository"
import { ApplicabilityRepository } from "./supabase/repositories/applicability-repository"
import { LegalReferenceRepository } from "./supabase/repositories/legal-reference-repository"
import { RegulatoryFrameworkRepository } from "./supabase/repositories/regulatory-framework-repository"
import { ControlMeasureTemplateRepository } from "./supabase/repositories/control-measure-template-repository"
import { EvidenceTypeRepository } from "./supabase/repositories/evidence-type-repository"
import { ControlMeasureEvidenceRepository } from "./supabase/repositories/control-measure-evidence-repository"
import { DocumentRepository } from "./supabase/repositories/document-repository"
import { DocumentVersionsRepository } from "./supabase/repositories/document-versions-repository"

export class SupabaseDatabaseProvider implements DatabaseProvider {
  private supabase: SupabaseClient
  private tenantId: string

  private repos: {
    organizations: OrganizationRepository
    users: UserRepository
    requirements: RequirementRepository
    evidence: EvidenceRepository
    compliance: ComplianceRepository
    controls: ControlRepository
    applicability: ApplicabilityRepository
    legalReferences: LegalReferenceRepository
    regulatoryFrameworks: RegulatoryFrameworkRepository
    controlMeasureTemplates: ControlMeasureTemplateRepository
    evidenceTypes: EvidenceTypeRepository
    controlMeasureEvidence: ControlMeasureEvidenceRepository
    documents: DocumentRepository
    documentVersions: DocumentVersionsRepository
  }

  requirements!: DatabaseProvider["requirements"]
  regulatoryFrameworks!: DatabaseProvider["regulatoryFrameworks"]
  organizationTypes!: DatabaseProvider["organizationTypes"]
  organizations!: DatabaseProvider["organizations"]
  compliance!: DatabaseProvider["compliance"]
  users!: DatabaseProvider["users"]
  evidence!: DatabaseProvider["evidence"]
  controlEvidence!: DatabaseProvider["controlEvidence"]
  applicability!: DatabaseProvider["applicability"]
  organizationRequirements!: DatabaseProvider["organizationRequirements"]
  controls!: DatabaseProvider["controls"]
  requirementControls!: DatabaseProvider["requirementControls"]
  organizationControls!: DatabaseProvider["organizationControls"]
  documents!: DatabaseProvider["documents"]
  documentVersions!: DatabaseProvider["documentVersions"]
  documentAnalyses!: DatabaseProvider["documentAnalyses"]
  documentDiffs!: DatabaseProvider["documentDiffs"]
  evidenceTypes!: DatabaseProvider["evidenceTypes"]
  controlMeasureTemplates!: DatabaseProvider["controlMeasureTemplates"]
  notifications!: DatabaseProvider["notifications"]
  complianceRecords!: DatabaseProvider["complianceRecords"]
  risks!: DatabaseProvider["risks"]
  riskMitigations!: DatabaseProvider["riskMitigations"]
  controlTemplates!: DatabaseProvider["controlTemplates"]
  requirementControlTemplates!: DatabaseProvider["requirementControlTemplates"]
  requirementLegalReferences!: DatabaseProvider["requirementLegalReferences"]
  legalArticles!: DatabaseProvider["legalArticles"]
  controlMeasureEvidence!: DatabaseProvider["controlMeasureEvidence"]

  constructor(supabase: SupabaseClient, tenantId?: string) {
    if (!supabase) {
      throw new Error("Supabase client is required")
    }

    this.supabase = supabase
    this.tenantId = tenantId || ""

    logger.debug("[SupabaseDatabaseProvider] Initialized", { tenantId })

    console.log("[v0] [SupabaseDatabaseProvider] Initializing", {
      tenantId,
      hasSupabase: !!supabase,
      supabaseType: typeof supabase,
    })

    this.repos = {
      organizations: new OrganizationRepository(supabase, tenantId),
      users: new UserRepository(supabase, tenantId),
      requirements: new RequirementRepository(supabase, tenantId),
      evidence: new EvidenceRepository(supabase, tenantId),
      compliance: new ComplianceRepository(supabase, tenantId),
      controls: new ControlRepository(supabase, tenantId),
      applicability: new ApplicabilityRepository(supabase, tenantId),
      legalReferences: new LegalReferenceRepository(supabase, tenantId),
      regulatoryFrameworks: new RegulatoryFrameworkRepository(supabase),
      controlMeasureTemplates: new ControlMeasureTemplateRepository(supabase, tenantId),
      evidenceTypes: new EvidenceTypeRepository(supabase, tenantId),
      controlMeasureEvidence: new ControlMeasureEvidenceRepository(supabase, tenantId),
      documents: new DocumentRepository(supabase, tenantId),
      documentVersions: new DocumentVersionsRepository(supabase, tenantId),
    }

    console.log("[v0] [SupabaseDatabaseProvider] Repositories created", {
      hasRegulatoryFrameworks: !!this.repos.regulatoryFrameworks,
      regulatoryFrameworksType: typeof this.repos.regulatoryFrameworks,
      hasControlMeasureTemplates: !!this.repos.controlMeasureTemplates,
      hasEvidenceTypes: !!this.repos.evidenceTypes,
      hasControlMeasureEvidence: !!this.repos.controlMeasureEvidence,
    })

    this.organizations = {
      findMany: async (filters) => this.repos.organizations.findMany(filters),
      findById: async (id) => this.repos.organizations.findById(id),
      findHierarchy: async () => this.repos.organizations.findHierarchy(),
      create: async (data) => this.repos.organizations.create(data),
      update: async (id, data) => this.repos.organizations.update(id, data),
      getAll: async () => this.repos.organizations.list(),
    }

    this.users = {
      getAll: async () => this.repos.users.getAll(),
      findById: async (id) => this.repos.users.findById(id),
      findByEmail: async (email) => this.repos.users.findByEmail(email),
      create: async (data) => this.repos.users.create(data),
      update: async (id, data) => this.repos.users.update(id, data),
    }

    this.requirements = {
      findMany: async (filters) => this.repos.requirements.findMany(filters),
      findById: async (id) => this.repos.requirements.findById(id),
      create: async (data) => this.repos.requirements.create(data),
      update: async (id, data) => this.repos.requirements.update(id, data),
      delete: async (id) => this.repos.requirements.delete(id),
    }

    this.evidence = {
      findMany: async (filters) => this.repos.evidence.findMany(filters),
      findById: async (id) => this.repos.evidence.findById(id),
      findByCompliance: async (complianceId) => this.repos.evidence.findByCompliance(complianceId),
      findByControl: async (controlId) => this.repos.evidence.findByControl(controlId),
      create: async (data) => this.repos.evidence.create(data),
      update: async (id, data) => this.repos.evidence.update(id, data),
      delete: async (id) => this.repos.evidence.delete(id),
    }

    this.compliance = {
      findMany: async (filters) => this.repos.compliance.findMany(filters),
      findById: async (id) => this.repos.compliance.findById(id),
      findByOrganization: async (orgId) => this.repos.compliance.findByOrganization(orgId),
      create: async (data) => this.repos.compliance.create(data),
      update: async (id, data) => this.repos.compliance.update(id, data),
      createMany: async (data) => this.repos.compliance.createMany(data),
    }

    this.controls = {
      findMany: async (filters) => this.repos.controls.findMany(filters),
      findById: async (id) => this.repos.controls.findById(id),
      create: async (data) => this.repos.controls.create(data),
      update: async (id, data) => this.repos.controls.update(id, data),
      delete: async (id) => this.repos.controls.delete(id),
    }

    this.applicability = {
      getRule: async (requirementId) => this.repos.applicability.getRule(requirementId),
      upsertRule: async (data) => this.repos.applicability.upsertRule(data),
      getMappings: async (requirementId) => this.repos.applicability.getMappings(requirementId),
      createMapping: async (data) => this.repos.applicability.createMapping(data),
      upsertMapping: async (data) => this.repos.applicability.upsertMapping(data),
      deleteMapping: async (requirementId, orgId) => this.repos.applicability.deleteMapping(requirementId, orgId),
    }

    this.requirementLegalReferences = {
      findByRequirement: async (requirementId) => this.repos.legalReferences.findByRequirement(requirementId),
      create: async (data) => this.repos.legalReferences.create(data),
      update: async (id, data) => this.repos.legalReferences.update(id, data),
      delete: async (id) => this.repos.legalReferences.delete(id),
    }

    this.regulatoryFrameworks = {
      findMany: async () => {
        console.log("[v0] [SupabaseDatabaseProvider] regulatoryFrameworks.findMany called", {
          hasRepo: !!this.repos.regulatoryFrameworks,
          repoType: typeof this.repos.regulatoryFrameworks,
        })
        return this.repos.regulatoryFrameworks.findMany()
      },
      findById: async (id) => this.repos.regulatoryFrameworks.findById(id),
      create: async (data) => this.repos.regulatoryFrameworks.create(data),
      update: async (id, data) => this.repos.regulatoryFrameworks.update(id, data),
      delete: async (id) => this.repos.regulatoryFrameworks.delete(id),
    }

    console.log("[v0] [SupabaseDatabaseProvider] regulatoryFrameworks interface assigned", {
      hasInterface: !!this.regulatoryFrameworks,
      hasFindMany: !!this.regulatoryFrameworks.findMany,
    })

    this.controlMeasureTemplates = {
      findMany: async (filters) => {
        console.log("[v0] [SupabaseDatabaseProvider] controlMeasureTemplates.findMany called", {
          hasRepo: !!this.repos.controlMeasureTemplates,
          repoType: typeof this.repos.controlMeasureTemplates,
        })
        return this.repos.controlMeasureTemplates.findMany(filters)
      },
      findById: async (id) => this.repos.controlMeasureTemplates.findById(id),
      findByRequirement: async (requirementId) => this.repos.controlMeasureTemplates.findByRequirement(requirementId),
      create: async (data) => this.repos.controlMeasureTemplates.create(data),
      update: async (id, data) => this.repos.controlMeasureTemplates.update(id, data),
      delete: async (id) => this.repos.controlMeasureTemplates.delete(id),
    }

    console.log("[v0] [SupabaseDatabaseProvider] controlMeasureTemplates interface assigned", {
      hasInterface: !!this.controlMeasureTemplates,
      hasFindMany: !!this.controlMeasureTemplates.findMany,
    })

    this.evidenceTypes = {
      findMany: async (filters) => {
        console.log("[v0] [SupabaseDatabaseProvider] evidenceTypes.findMany called", {
          hasRepo: !!this.repos.evidenceTypes,
          repoType: typeof this.repos.evidenceTypes,
        })
        return this.repos.evidenceTypes.findMany(filters)
      },
      findById: async (id) => this.repos.evidenceTypes.findById(id),
      create: async (data) => this.repos.evidenceTypes.create(data),
      update: async (id, data) => this.repos.evidenceTypes.update(id, data),
      delete: async (id) => this.repos.evidenceTypes.delete(id),
    }

    console.log("[v0] [SupabaseDatabaseProvider] evidenceTypes interface assigned", {
      hasInterface: !!this.evidenceTypes,
      hasFindMany: !!this.evidenceTypes.findMany,
    })

    this.controlMeasureEvidence = {
      findByControlMeasure: async (controlMeasureId) =>
        this.repos.controlMeasureEvidence.findByControlMeasure(controlMeasureId),
      findByEvidence: async (evidenceId) => this.repos.controlMeasureEvidence.findByEvidence(evidenceId),
      link: async (data) => this.repos.controlMeasureEvidence.link(data),
      unlink: async (controlMeasureId, evidenceId) =>
        this.repos.controlMeasureEvidence.unlink(controlMeasureId, evidenceId),
      updateLink: async (controlMeasureId, evidenceId, data) =>
        this.repos.controlMeasureEvidence.updateLink(controlMeasureId, evidenceId, data),
    }

    console.log("[v0] [SupabaseDatabaseProvider] controlMeasureEvidence interface assigned", {
      hasInterface: !!this.controlMeasureEvidence,
      hasLink: !!this.controlMeasureEvidence.link,
    })

    this.organizationTypes = {
      findMany: async () => [],
      findById: async () => null,
      create: async () => ({}) as any,
      update: async () => ({}) as any,
      delete: async () => {},
    }

    this.organizationRequirements = {} as any
    // Documents (реализовано!)
    this.documents = {
      findMany: async (filters) => this.repos.documents.findMany(filters),
      findById: async (id) => this.repos.documents.findById(id),
      create: async (data) => this.repos.documents.create(data),
      update: async (id, data) => this.repos.documents.update(id, data),
      delete: async (id) => this.repos.documents.delete(id),
      findExpiring: async (withinDays) => this.repos.documents.findExpiring(withinDays),
    }
    
    this.documentVersions = {
      create: async (data) => this.repos.documentVersions.create(data),
    }
    this.documentAnalyses = {} as any
    this.documentDiffs = {} as any
    this.notifications = {} as any
    this.complianceRecords = {} as any
    this.risks = {} as any
    this.riskMitigations = {} as any
    this.controlTemplates = {} as any
    this.requirementControlTemplates = {} as any
    this.legalArticles = {} as any
    this.controlEvidence = {} as any
    this.requirementControls = {} as any
    this.organizationControls = {} as any

    console.log("[v0] [SupabaseDatabaseProvider] Initialization complete")
  }
}

export function getDatabaseProvider(useServiceRole = false, tenantId?: string): DatabaseProvider {
  const supabaseClient = useServiceRole ? createServiceRoleClient() : undefined

  return new SupabaseDatabaseProvider(supabaseClient as SupabaseClient, tenantId)
}
