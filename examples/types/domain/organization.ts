export interface OrganizationAttributes {
  kiiCategory: 1 | 2 | 3 | null // Категория КИИ
  pdnLevel: 1 | 2 | 3 | 4 | null // Уровень защищенности ПДн
  isFinancial: boolean // Финансовая организация
  isHealthcare: boolean // Медицинская организация
  isGovernment: boolean // Государственная организация
  employeeCount: number | null // Количество сотрудников
  hasForeignData: boolean // Обработка данных иностранных граждан
  attributesUpdatedAt: Date | null
  attributesUpdatedBy: string | null
}

export interface Organization {
  id: string
  name: string
  typeId: string | null
  parentId: string | null
  level: number
  isActive: boolean

  // Реквизиты
  inn: string | null
  ogrn: string | null
  industry: string | null

  // Контакты
  address: string | null
  contact_person_name: string | null
  contact_person_email: string | null
  contact_person_phone: string | null

  // Атрибуты
  employee_count: number | null
  has_pdn: boolean
  has_kii: boolean
  description: string | null

  // Системные поля
  createdAt: Date
  updatedAt: Date

  tenantId: string

  // Расширенные атрибуты (опционально)
  attributes?: OrganizationAttributes

  organizationType?: {
    id: string
    code: string
    name: string
    icon: string | null
  }

  isRoot?: boolean
}

export function isRootOrganization(org: Organization): boolean {
  return org.id === org.tenantId && org.parentId === null && org.level === 0
}
