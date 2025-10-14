import type { DatabaseProvider } from "@/providers/database-provider"
import type { OrganizationRequirementsResult } from "@/types/domain/organization-requirements"
import type { RequirementFilters } from "@/types/dto/requirement-dto"

export class OrganizationRequirementsService {
  constructor(private db: DatabaseProvider) {}

  /**
   * Get all requirements applicable to an organization
   */
  async getOrganizationRequirements(organizationId: string): Promise<OrganizationRequirementsResult> {
    return await this.db.organizationRequirements.getRequirements(organizationId)
  }

  /**
   * Add a single requirement manually to an organization
   */
  async addManualRequirement(
    organizationId: string,
    requirementId: string,
    reason: string,
    userId: string,
  ): Promise<void> {
    await this.db.organizationRequirements.addManualRequirement(organizationId, requirementId, reason, userId)
  }

  /**
   * Remove manual requirement mapping (revert to automatic or remove completely)
   */
  async removeManualRequirement(organizationId: string, requirementId: string): Promise<void> {
    await this.db.organizationRequirements.removeManualRequirement(organizationId, requirementId)
  }

  /**
   * Add multiple requirements by filter criteria
   */
  async addRequirementsByFilter(
    organizationId: string,
    filters: RequirementFilters,
    reason: string,
    userId: string,
  ): Promise<number> {
    return await this.db.organizationRequirements.addRequirementsByFilter(organizationId, filters, reason, userId)
  }
}
