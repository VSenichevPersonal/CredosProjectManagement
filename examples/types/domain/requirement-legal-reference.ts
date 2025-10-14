export interface RequirementLegalReference {
  id: string
  tenantId: string
  requirementId: string
  legalArticleId: string
  isPrimary: boolean
  relevanceNote?: string
  createdAt: string
  updatedAt: string

  // Relations (loaded when needed)
  legalArticle?: {
    id: string
    fullReference: string
    title?: string
    content?: string
    articleNumber?: string
    part?: string
    paragraph?: string
    clause?: string
    subclause?: string
    regulatoryFrameworkId: string
  }
}

export interface CreateRequirementLegalReferenceDTO {
  requirementId: string
  legalArticleId: string
  isPrimary?: boolean
  relevanceNote?: string
}

export interface UpdateRequirementLegalReferenceDTO {
  isPrimary?: boolean
  relevanceNote?: string
}
