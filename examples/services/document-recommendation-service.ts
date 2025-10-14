/**
 * @intent: Service for recommending document templates
 * @architecture: DDD service layer  
 * @llm-note: Умные рекомендации документов для требований
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { RequirementDocumentTemplate } from "@/types/dto/document-dto"

export class DocumentRecommendationService {
  /**
   * @intent: Get recommended document templates for requirement
   * @precondition: requirement exists
   * @postcondition: returns sorted recommendations
   */
  static async getRecommendationsForRequirement(
    ctx: ExecutionContext,
    requirementId: string
  ): Promise<RequirementDocumentTemplate[]> {
    ctx.logger.info("[DocumentRecommendationService] getRecommendationsFor Requirement", { requirementId })
    
    const recommendations = await ctx.db.requirementDocumentTemplates.findByRequirement(requirementId)
    
    // Сортируем по приоритету
    recommendations.sort((a, b) => b.priority - a.priority)
    
    return recommendations
  }
  
  /**
   * @intent: Auto-create recommended documents for compliance_record
   * @precondition: compliance_record exists
   * @postcondition: draft documents created, evidence linked
   */
  static async autoCreateDocuments(
    ctx: ExecutionContext,
    complianceRecordId: string
  ): Promise<{
    documents: any[]
    evidence: any[]
    measures: any[]
  }> {
    ctx.logger.info("[DocumentRecommendationService] autoCreateDocuments", { complianceRecordId })
    
    // Получить compliance_record
    const record = await ctx.db.complianceRecords.findById(complianceRecordId)
    if (!record) {
      throw new Error("Compliance record not found")
    }
    
    // Получить requirement
    const requirement = await ctx.db.requirements.findById(record.requirementId)
    if (!requirement) {
      throw new Error("Requirement not found")
    }
    
    // Получить рекомендации с флагом auto_create
    const recommendations = await ctx.db.requirementDocumentTemplates.findByRequirement(
      requirement.id,
      { autoCreateOnCompliance: true }
    )
    
    const createdDocuments = []
    const createdEvidence = []
    const linkedMeasures = []
    
    for (const rec of recommendations) {
      // 1. Создать черновик документа
      const document = await ctx.db.documents.create({
        tenantId: ctx.tenantId,
        organizationId: record.organizationId,
        documentTypeId: rec.documentTypeId,
        templateId: rec.templateId,
        title: this.generateDocumentTitle(rec.template, record.organization),
        lifecycleStatus: 'draft',
        ownerId: ctx.user!.id,
        createdBy: ctx.user!.id
      })
      
      createdDocuments.push(document)
      
      // 2. Создать evidence для этого документа
      const evidence = await ctx.db.evidence.create({
        tenantId: ctx.tenantId,
        organizationId: record.organizationId,
        documentId: document.id,  // ⭐ Ссылка на документ
        complianceRecordId: complianceRecordId,
        requirementId: requirement.id,
        evidenceTypeId: rec.documentType?.defaultEvidenceTypeId,
        title: document.title,
        uploadedBy: ctx.user!.id
      })
      
      createdEvidence.push(evidence)
      
      // 3. Связать с рекомендуемыми мерами
      if (rec.suggestedControlTemplateIds && rec.suggestedControlTemplateIds.length > 0) {
        for (const templateId of rec.suggestedControlTemplateIds) {
          // Найти меру созданную из этого template
          const measures = await ctx.db.controlMeasures.findByCompliance(complianceRecordId)
          const measure = measures.find(m => m.templateId === templateId)
          
          if (measure) {
            // Создать evidence_link
            await ctx.db.evidenceLinks.create({
              evidenceId: evidence.id,
              controlMeasureId: measure.id,
              linkNotes: `Автоматически создано из рекомендации для ${requirement.code}`,
              createdBy: ctx.user!.id
            })
            
            linkedMeasures.push(measure)
          }
        }
      }
    }
    
    ctx.logger.info("[DocumentRecommendationService] autoCreateDocuments completed", {
      documentsCount: createdDocuments.length,
      evidenceCount: createdEvidence.length,
      linksCount: linkedMeasures.length
    })
    
    return {
      documents: createdDocuments,
      evidence: createdEvidence,
      measures: linkedMeasures
    }
  }
  
  /**
   * Генерация названия документа из шаблона
   */
  private static generateDocumentTitle(template: any, organization: any): string {
    let title = template.title
    
    // Подстановка placeholders
    if (organization) {
      title = title.replace('{organization}', organization.name || '')
      title = title.replace('{org}', organization.shortName || organization.name || '')
    }
    
    return title
  }
}

