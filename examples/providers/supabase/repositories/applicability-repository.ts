import type { SupabaseClient } from "@supabase/supabase-js"
import type { RequirementApplicabilityRule, RequirementOrganizationMapping } from "@/types/domain/applicability"
import {
  mapApplicabilityRule,
  mapOrganizationMapping,
  mapApplicabilityRuleToDb,
  mapOrganizationMappingToDb,
} from "../mappers/applicability-mapper"

export class ApplicabilityRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string,
  ) {}

  async getRule(requirementId: string): Promise<RequirementApplicabilityRule | null> {
    const { data, error } = await this.supabase
      .from("requirement_applicability_rules")
      .select("*")
      .eq("requirement_id", requirementId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(error.message)
    }
    return mapApplicabilityRule(data)
  }

  async upsertRule(data: {
    requirementId: string
    ruleType: "automatic" | "manual"
    filterRules: any
    createdBy: string | null
  }): Promise<RequirementApplicabilityRule> {
    const { data: upserted, error } = await this.supabase
      .from("requirement_applicability_rules")
      .upsert(mapApplicabilityRuleToDb(data), { onConflict: "requirement_id" })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapApplicabilityRule(upserted)
  }

  async getMappings(requirementId: string): Promise<RequirementOrganizationMapping[]> {
    const { data, error } = await this.supabase
      .from("requirement_organization_mappings")
      .select("*")
      .eq("requirement_id", requirementId)

    if (error) throw new Error(error.message)
    return (data || []).map(mapOrganizationMapping)
  }

  async createMapping(data: {
    requirementId: string
    organizationId: string
    mappingType: "automatic" | "manual_include" | "manual_exclude"
    reason: string | null
    createdBy: string | null
  }): Promise<RequirementOrganizationMapping> {
    const { data: created, error } = await this.supabase
      .from("requirement_organization_mappings")
      .insert(mapOrganizationMappingToDb(data))
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapOrganizationMapping(created)
  }

  async upsertMapping(data: {
    requirementId: string
    organizationId: string
    mappingType: "automatic" | "manual_include" | "manual_exclude"
    reason: string | null
    createdBy: string | null
  }): Promise<RequirementOrganizationMapping> {
    const { data: upserted, error } = await this.supabase
      .from("requirement_organization_mappings")
      .upsert(mapOrganizationMappingToDb(data), { onConflict: "requirement_id,organization_id" })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapOrganizationMapping(upserted)
  }

  async deleteMapping(id: string): Promise<void> {
    const { error } = await this.supabase.from("requirement_organization_mappings").delete().eq("id", id)

    if (error) throw new Error(error.message)
  }
}
