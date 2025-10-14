import type { DatabaseProvider } from "@/providers/database-provider"
import type { ApplicabilityFilterRules, ApplicabilityResult } from "@/types/domain/applicability"
import type { Organization } from "@/types/domain/organization"

export class ApplicabilityService {
  constructor(private db: DatabaseProvider) {}

  /**
   * Calculate which organizations match the filter rules
   */
  calculateApplicableOrganizations(
    organizations: Organization[],
    filterRules: ApplicabilityFilterRules,
  ): Organization[] {
    const hasAnyRules = Object.keys(filterRules).length > 0
    if (!hasAnyRules) {
      console.log("[v0] No filter rules defined, returning all organizations")
      return organizations
    }

    return organizations.filter((org) => {
      if (!org.attributes) {
        console.log("[v0] Organization has no attributes:", org.id, org.name)
        return false
      }

      // Check KII category
      if (filterRules.kiiCategory && filterRules.kiiCategory.length > 0) {
        if (!org.attributes.kiiCategory || !filterRules.kiiCategory.includes(org.attributes.kiiCategory)) {
          return false
        }
      }

      // Check PDN level
      if (filterRules.pdnLevel && filterRules.pdnLevel.length > 0) {
        if (!org.attributes.pdnLevel || !filterRules.pdnLevel.includes(org.attributes.pdnLevel)) {
          return false
        }
      }

      // Check financial
      if (filterRules.isFinancial !== undefined) {
        if (org.attributes.isFinancial !== filterRules.isFinancial) {
          return false
        }
      }

      // Check healthcare
      if (filterRules.isHealthcare !== undefined) {
        if (org.attributes.isHealthcare !== filterRules.isHealthcare) {
          return false
        }
      }

      // Check government
      if (filterRules.isGovernment !== undefined) {
        if (org.attributes.isGovernment !== filterRules.isGovernment) {
          return false
        }
      }

      // Check foreign data
      if (filterRules.hasForeignData !== undefined) {
        if (org.attributes.hasForeignData !== filterRules.hasForeignData) {
          return false
        }
      }

      // Check employee count range
      if (filterRules.minEmployeeCount !== undefined) {
        if (!org.attributes.employeeCount || org.attributes.employeeCount < filterRules.minEmployeeCount) {
          return false
        }
      }

      if (filterRules.maxEmployeeCount !== undefined) {
        if (!org.attributes.employeeCount || org.attributes.employeeCount > filterRules.maxEmployeeCount) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Get applicability result for a requirement
   */
  async getApplicabilityResult(requirementId: string): Promise<ApplicabilityResult> {
    console.log("[v0] ApplicabilityService.getApplicabilityResult:", requirementId)

    // Get all organizations
    const organizations = await this.db.organizations.findMany({})
    console.log("[v0] Total organizations loaded:", organizations.length)
    console.log("[v0] Organizations with attributes:", organizations.filter((o) => o.attributes).length)

    // Get applicability rule
    const rule = await this.db.applicability.getRule(requirementId)
    console.log("[v0] Applicability rule:", rule ? "exists" : "not found")

    // Get existing mappings
    const mappings = await this.db.applicability.getMappings(requirementId)
    console.log("[v0] Existing mappings:", mappings.length)

    const allOrgsWithStatus = organizations.map((org) => {
      const mapping = mappings.find((m) => m.organizationId === org.id)

      if (mapping) {
        // Если есть mapping, используем его тип
        return {
          id: org.id,
          name: org.name,
          mappingType: mapping.mappingType,
          reason: mapping.reason || undefined,
        }
      }

      // Если нет mapping, проверяем соответствие правилам
      let isApplicable = false
      if (rule && rule.filterRules && Object.keys(rule.filterRules).length > 0) {
        const applicableOrgs = this.calculateApplicableOrganizations([org], rule.filterRules)
        isApplicable = applicableOrgs.length > 0
      } else {
        // Если нет правил, все организации потенциально применимы
        isApplicable = true
      }

      return {
        id: org.id,
        name: org.name,
        mappingType: isApplicable ? ("automatic" as const) : ("none" as const),
        reason: undefined,
      }
    })

    // Подсчет статистики
    const manualIncludes = allOrgsWithStatus.filter((o) => o.mappingType === "manual_include")
    const manualExcludes = allOrgsWithStatus.filter((o) => o.mappingType === "manual_exclude")
    const automatic = allOrgsWithStatus.filter((o) => o.mappingType === "automatic")
    const applicable = allOrgsWithStatus.filter((o) => o.mappingType !== "manual_exclude" && o.mappingType !== "none")

    // Build result
    const result: ApplicabilityResult = {
      requirementId,
      totalOrganizations: organizations.length,
      applicableOrganizations: applicable.length,
      automaticCount: automatic.length,
      manualIncludeCount: manualIncludes.length,
      manualExcludeCount: manualExcludes.length,
      organizations: applicable, // Only include applicable organizations
    }

    console.log("[v0] Result:", {
      total: result.totalOrganizations,
      applicable: result.applicableOrganizations,
      automatic: result.automaticCount,
      manualInclude: result.manualIncludeCount,
      manualExclude: result.manualExcludeCount,
      organizationsInList: result.organizations.length,
    })

    return result
  }

  /**
   * Get applicable organizations for a requirement with optional search
   */
  async getApplicableOrganizations(requirementId: string, search?: string): Promise<any[]> {
    const result = await this.getApplicabilityResult(requirementId)
    let organizations = result.organizations || []

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase()
      organizations = organizations.filter((org) => org.name.toLowerCase().includes(searchLower))
    }

    return organizations
  }

  /**
   * Update applicability rule for a requirement
   */
  async updateApplicabilityRule(
    requirementId: string,
    filterRules: ApplicabilityFilterRules,
    userId: string,
  ): Promise<void> {
    await this.db.applicability.upsertRule({
      requirementId,
      ruleType: "automatic",
      filterRules,
      createdBy: userId,
    })

    // Recalculate automatic mappings
    await this.recalculateMappings(requirementId)
  }

  /**
   * Recalculate automatic mappings based on rules
   */
  async recalculateMappings(requirementId: string): Promise<void> {
    const rule = await this.db.applicability.getRule(requirementId)
    if (!rule || !rule.filterRules) return

    const organizations = await this.db.organizations.findMany({})
    const applicableOrgs = this.calculateApplicableOrganizations(organizations, rule.filterRules)

    // Get existing mappings
    const existingMappings = await this.db.applicability.getMappings(requirementId)

    // Remove old automatic mappings
    const automaticMappings = existingMappings.filter((m) => m.mappingType === "automatic")
    for (const mapping of automaticMappings) {
      await this.db.applicability.deleteMapping(mapping.id)
    }

    // Create new automatic mappings
    for (const org of applicableOrgs) {
      // Skip if there's a manual exclude
      const hasManualExclude = existingMappings.find(
        (m) => m.organizationId === org.id && m.mappingType === "manual_exclude",
      )
      if (hasManualExclude) continue

      // Skip if there's already a manual include
      const hasManualInclude = existingMappings.find(
        (m) => m.organizationId === org.id && m.mappingType === "manual_include",
      )
      if (hasManualInclude) continue

      await this.db.applicability.createMapping({
        requirementId,
        organizationId: org.id,
        mappingType: "automatic",
        reason: null,
        createdBy: null,
      })
    }
  }

  /**
   * Add manual include
   */
  async addManualInclude(requirementId: string, organizationId: string, reason: string, userId: string): Promise<void> {
    await this.db.applicability.upsertMapping({
      requirementId,
      organizationId,
      mappingType: "manual_include",
      reason,
      createdBy: userId,
    })
  }

  /**
   * Add manual exclude
   */
  async addManualExclude(requirementId: string, organizationId: string, reason: string, userId: string): Promise<void> {
    await this.db.applicability.upsertMapping({
      requirementId,
      organizationId,
      mappingType: "manual_exclude",
      reason,
      createdBy: userId,
    })
  }

  /**
   * Remove manual override (revert to automatic)
   */
  async removeManualOverride(requirementId: string, organizationId: string): Promise<void> {
    const mappings = await this.db.applicability.getMappings(requirementId)
    const mapping = mappings.find((m) => m.organizationId === organizationId)

    if (mapping && (mapping.mappingType === "manual_include" || mapping.mappingType === "manual_exclude")) {
      await this.db.applicability.deleteMapping(mapping.id)

      // Recalculate to restore automatic mapping if applicable
      await this.recalculateMappings(requirementId)
    }
  }
}
