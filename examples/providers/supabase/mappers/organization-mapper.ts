import type { Organization } from "@/types/domain"

export const OrganizationMapper = {
  fromDb(row: any): Organization {
    return {
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      typeId: row.type_id,
      parentId: row.parent_id,
      level: row.level,
      isActive: row.is_active ?? true,
      inn: row.inn,
      ogrn: row.ogrn,
      address: row.address,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      tenantId: row.tenant_id,
      organizationType: row.organization_types
        ? {
            id: row.organization_types.id,
            code: row.organization_types.code,
            name: row.organization_types.name,
            icon: row.organization_types.icon,
          }
        : undefined,
      attributes: row.organization_attributes
        ? {
            kiiCategory: row.organization_attributes.kii_category,
            pdnLevel: row.organization_attributes.pdn_level,
            isFinancial: row.organization_attributes.is_financial,
            isHealthcare: row.organization_attributes.is_healthcare,
            isGovernment: row.organization_attributes.is_government,
            employeeCount: row.organization_attributes.employee_count,
            hasForeignData: row.organization_attributes.has_foreign_data,
          }
        : undefined,
    }
  },

  toDb(org: Partial<Organization>): any {
    return {
      name: org.name,
      short_name: org.shortName,
      type_id: org.typeId,
      parent_id: org.parentId,
      level: org.level,
      is_active: org.isActive,
      inn: org.inn,
      ogrn: org.ogrn,
      address: org.address,
      contact_email: org.contactEmail,
      contact_phone: org.contactPhone,
      tenant_id: org.tenantId,
    }
  },
}
