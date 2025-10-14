import type { RequirementApplicabilityRule, RequirementOrganizationMapping } from "./types" // Assuming types are declared in a separate file

export function mapApplicabilityRule(row: any): RequirementApplicabilityRule {
  return {
    id: row.id,
    requirementId: row.requirement_id,
    ruleType: row.rule_type,
    filterRules: row.filter_rules,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapOrganizationMapping(row: any): RequirementOrganizationMapping {
  return {
    id: row.id,
    requirementId: row.requirement_id,
    organizationId: row.organization_id,
    mappingType: row.mapping_type,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapApplicabilityRuleToDb(rule: Partial<RequirementApplicabilityRule>): any {
  return {
    requirement_id: rule.requirementId,
    rule_type: rule.ruleType,
    filter_rules: rule.filterRules,
    created_by: rule.createdBy,
  }
}

export function mapOrganizationMappingToDb(mapping: Partial<RequirementOrganizationMapping>): any {
  return {
    requirement_id: mapping.requirementId,
    organization_id: mapping.organizationId,
    mapping_type: mapping.mappingType,
    reason: mapping.reason,
    created_by: mapping.createdBy,
  }
}
