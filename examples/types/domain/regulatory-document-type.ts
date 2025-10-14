export interface RegulatoryDocumentType {
  id: string
  tenantId: string
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  sortOrder: number
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRegulatoryDocumentTypeInput {
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  sortOrder?: number
}

export interface UpdateRegulatoryDocumentTypeInput extends Partial<CreateRegulatoryDocumentTypeInput> {
  isActive?: boolean
}

export const DEFAULT_DOCUMENT_TYPES = {
  legislative: {
    code: "legislative",
    name: "Законодательные",
    description: "Федеральные законы, постановления правительства, приказы ведомств",
    icon: "scale",
    color: "blue",
  },
  internal: {
    code: "internal",
    name: "Внутренние",
    description: "Внутренние политики, регламенты, инструкции организации",
    icon: "building",
    color: "purple",
  },
  qms: {
    code: "qms",
    name: "СМК (ISO, ГОСТ)",
    description: "Стандарты систем менеджмента качества (ISO 27001, ISO 9001, ГОСТ Р и др.)",
    icon: "award",
    color: "green",
  },
} as const
