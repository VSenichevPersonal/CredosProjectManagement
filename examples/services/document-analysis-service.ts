import type { DatabaseProvider } from "@/providers/database-provider"
import type { DocumentAnalysis } from "@/types/domain/document"
import { LLMFactory, type LLMProviderType } from "@/lib/providers/llm/llm-factory"
import { AppError } from "@/lib/errors"

export class DocumentAnalysisService {
  constructor(private db: DatabaseProvider) {}

  async analyzeDocument(
    userId: string,
    documentId: string,
    fromVersionId: string | null,
    toVersionId: string,
    provider: LLMProviderType = "openai",
  ): Promise<DocumentAnalysis> {
    try {
      // Get document
      const document = await this.db.documents.findById(documentId)
      if (!document) {
        throw new AppError("Document not found", 404)
      }

      // Get versions
      const toVersion = await this.db.documentVersions.findById(toVersionId)
      if (!toVersion) {
        throw new AppError("Target version not found", 404)
      }

      let fromVersion = null
      if (fromVersionId) {
        fromVersion = await this.db.documentVersions.findById(fromVersionId)
        if (!fromVersion) {
          throw new AppError("Source version not found", 404)
        }
      }

      // Create analysis record
      const analysis = await this.db.documentAnalyses.create({
        documentId,
        fromVersionId,
        toVersionId,
        status: "processing",
        llmProvider: provider,
        llmModel: provider === "openai" ? "gpt-4o" : "claude-3-5-sonnet-20241022",
      })

      try {
        // Get LLM provider
        const llm = LLMFactory.create(provider)

        // TODO: Extract text from documents (PDF, DOCX, etc.)
        // For now, use placeholder content
        const previousContent = fromVersion ? `Содержание версии ${fromVersion.versionNumber}` : undefined
        const currentContent = `Содержание версии ${toVersion.versionNumber}`

        // Analyze changes
        const result = await llm.analyzeDocumentChanges({
          documentTitle: document.title || document.fileName,
          previousContent,
          currentContent,
          context: document.description,
        })

        // Update analysis with results
        await this.db.documentAnalyses.update(analysis.id, {
          status: "completed",
          summary: result.summary,
          criticalChanges: result.criticalChanges,
          impactAssessment: result.impactAssessment,
          recommendations: result.recommendations,
          tokensUsed: result.tokensUsed,
          processingTimeMs: result.processingTimeMs,
          completedAt: new Date(),
        })

        return (await this.db.documentAnalyses.findById(analysis.id)) as DocumentAnalysis
      } catch (error) {
        // Update analysis with error
        await this.db.documentAnalyses.update(analysis.id, {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })

        throw error
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error) {
        throw new AppError(`Failed to analyze document: ${error.message}`, 500)
      }
      throw new AppError("Failed to analyze document", 500)
    }
  }

  async getAnalyses(userId: string, documentId: string): Promise<DocumentAnalysis[]> {
    try {
      return await this.db.documentAnalyses.findByDocument(documentId)
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`Failed to fetch analyses: ${error.message}`, 500)
      }
      throw new AppError("Failed to fetch analyses", 500)
    }
  }

  async getAnalysisById(userId: string, analysisId: string): Promise<DocumentAnalysis> {
    try {
      const analysis = await this.db.documentAnalyses.findById(analysisId)

      if (!analysis) {
        throw new AppError("Analysis not found", 404)
      }

      return analysis
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error) {
        throw new AppError(`Failed to fetch analysis: ${error.message}`, 500)
      }
      throw new AppError("Failed to fetch analysis", 500)
    }
  }

  async retryAnalysis(userId: string, analysisId: string): Promise<DocumentAnalysis> {
    try {
      const existingAnalysis = await this.db.documentAnalyses.findById(analysisId)

      if (!existingAnalysis) {
        throw new AppError("Analysis not found", 404)
      }

      // Create new analysis with same parameters
      return await this.analyzeDocument(
        userId,
        existingAnalysis.documentId,
        existingAnalysis.fromVersionId,
        existingAnalysis.toVersionId,
        existingAnalysis.llmProvider as LLMProviderType,
      )
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error) {
        throw new AppError(`Failed to retry analysis: ${error.message}`, 500)
      }
      throw new AppError("Failed to retry analysis", 500)
    }
  }
}
