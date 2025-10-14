import type { RequirementLegalReference } from "@/types/domain/legal-reference"

export class LegalReferenceMapper {
  static fromDb(row: any): RequirementLegalReference {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      requirementId: row.requirement_id,
      legalArticleId: row.legal_article_id,
      isPrimary: row.is_primary,
      relevanceNote: row.relevance_note,
      referenceType: row.reference_type,
      notes: row.notes,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      legalArticle: row.legal_articles
        ? {
            id: row.legal_articles.id,
            fullReference: row.legal_articles.full_reference,
            title: row.legal_articles.title,
            content: row.legal_articles.content,
            articleNumber: row.legal_articles.article_number,
            part: row.legal_articles.part,
            paragraph: row.legal_articles.paragraph,
            clause: row.legal_articles.clause,
            subclause: row.legal_articles.subclause,
            regulatoryFrameworkId: row.legal_articles.regulatory_framework_id,
          }
        : undefined,
    }
  }

  static toDb(data: Partial<RequirementLegalReference>): any {
    return {
      requirement_id: data.requirementId,
      legal_article_id: data.legalArticleId,
      is_primary: data.isPrimary,
      relevance_note: data.relevanceNote,
      reference_type: data.referenceType,
      notes: data.notes,
      tenant_id: data.tenantId,
    }
  }
}
