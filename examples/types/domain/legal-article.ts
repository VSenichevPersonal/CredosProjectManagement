export interface LegalArticle {
  id: string
  regulatoryFrameworkId: string
  tenantId: string

  // Article structure
  articleNumber?: string
  part?: string
  paragraph?: string
  clause?: string
  subclause?: string

  // Full reference
  fullReference: string

  // Content
  title?: string
  content?: string

  // Metadata
  isActive: boolean
  effectiveFrom?: string
  effectiveTo?: string

  createdAt: string
  updatedAt: string
}

export interface CreateLegalArticleDTO {
  regulatoryFrameworkId: string
  articleNumber?: string
  part?: string
  paragraph?: string
  clause?: string
  subclause?: string
  fullReference: string
  title?: string
  content?: string
  isActive?: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

export interface UpdateLegalArticleDTO extends Partial<CreateLegalArticleDTO> {}
