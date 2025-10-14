export type KBCategory = "regulator" | "requirement_type" | "how_to" | "faq" | "templates"

export interface KBArticle {
  id: string
  title: string
  slug: string
  category: KBCategory
  regulator: string | null
  requirementType: string | null
  content: string
  excerpt: string | null
  tags: string[]
  authorId: string | null
  views: number
  helpfulCount: number
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export type TemplateCategory = "policy" | "instruction" | "act" | "report" | "form"

export interface KBTemplate {
  id: string
  title: string
  description: string | null
  category: TemplateCategory
  regulator: string | null
  requirementType: string | null
  fileUrl: string
  fileType: string
  downloads: number
  createdAt: Date
}
