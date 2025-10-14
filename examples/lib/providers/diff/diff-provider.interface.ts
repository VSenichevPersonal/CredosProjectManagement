/**
 * @intent: Provider interface for document diff generation
 * @architecture: Pluggable architecture - allows switching between diff implementations
 * @llm-note: Similar to LLMProvider pattern - enables libre, Word, Aspose, etc.
 */

import type { DiffChange } from "@/types/domain/document"

export interface DiffResult {
  changes: DiffChange[]
  htmlOutput: string
  statistics: {
    additions: number
    deletions: number
    modifications: number
  }
}

export interface DiffProvider {
  name: string

  /**
   * Generate diff between two text contents
   */
  generateDiff(params: {
    fromContent: string | null
    toContent: string
    fromFileName?: string
    toFileName?: string
  }): Promise<DiffResult>

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>
}
