/**
 * @intent: Type definitions for Russian regulatory framework
 * @llm-note: Maps to kii_categories, pdn_protection_levels, fstec_security_measures tables (400 migration)
 * @architecture: Domain types for Russian information security compliance
 */

/**
 * КИИ (Критическая информационная инфраструктура) category
 * Based on 187-ФЗ "О безопасности критической информационной инфраструктуры"
 * Maps to: kii_categories table
 */
export interface KIICategory {
  id: string
  tenant_id: string
  category_number: number // 1, 2, or 3
  name: string
  description: string | null
  significance_criteria: string | null
  created_at: string
  updated_at: string
}

/**
 * ПДн (Персональные данные) protection level
 * Based on 152-ФЗ "О персональных данных"
 * Maps to: pdn_protection_levels table
 */
export interface PDNProtectionLevel {
  id: string
  tenant_id: string
  level_number: number // 1, 2, 3, or 4
  name: string
  description: string | null
  threat_model: string | null
  required_measures: string[] | null
  created_at: string
  updated_at: string
}

/**
 * ФСТЭК security measure
 * Based on ФСТЭК orders (№17, №21, №31, №239)
 * Maps to: fstec_security_measures table
 */
export interface FSTECSecurityMeasure {
  id: string
  tenant_id: string
  measure_code: string
  measure_type: string
  name: string
  description: string | null
  implementation_guide: string | null
  applicable_to: string[] | null // ["kii", "pdn", "gis"]
  created_at: string
  updated_at: string
}

/**
 * Extended organization attributes for Russian compliance
 * Extends organization_attributes table
 */
export interface RussianComplianceAttributes {
  // КИИ attributes
  has_kii: boolean
  kii_category: number | null // 1, 2, or 3

  // ПДн attributes
  has_pdn: boolean
  pdn_level: number | null // 1, 2, 3, or 4

  // Sector-specific
  is_government: boolean
  is_financial: boolean
  is_healthcare: boolean
  has_foreign_data: boolean

  // General
  employee_count: number | null
}

/**
 * DTOs for Russian compliance
 */
export interface AssignKIICategoryDTO {
  organization_id: string
  category_number: number
  justification?: string
}

export interface AssignPDNLevelDTO {
  organization_id: string
  level_number: number
  justification?: string
}

export interface ApplyFSTECMeasuresDTO {
  organization_id: string
  measure_codes: string[]
  implementation_notes?: string
}
