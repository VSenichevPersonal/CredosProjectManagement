export interface OrganizationType {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrganizationTypeDTO {
  code: string
  name: string
  description?: string
  icon?: string
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateOrganizationTypeDTO {
  code?: string
  name?: string
  description?: string
  icon?: string
  sortOrder?: number
  isActive?: boolean
}
