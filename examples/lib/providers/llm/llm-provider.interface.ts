import type { CriticalChange, Recommendation } from "@/types/domain/document"

export interface LLMProvider {
  name: string
  model: string

  /**
   * Analyze changes between two document versions
   */
  analyzeDocumentChanges(params: {
    documentTitle: string
    previousContent?: string
    currentContent: string
    context?: string
  }): Promise<{
    summary: string
    criticalChanges: CriticalChange[]
    impactAssessment: string
    recommendations: Recommendation[]
    tokensUsed?: number
    processingTimeMs?: number
  }>

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>
}
