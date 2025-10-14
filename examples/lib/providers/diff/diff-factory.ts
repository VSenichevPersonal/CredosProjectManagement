/**
 * @intent: Factory for creating diff providers
 * @architecture: Follows LLMFactory pattern - centralized provider creation
 */

import type { DiffProvider } from "./diff-provider.interface"
import { LibreDiffProvider } from "./libre-diff-provider"

export type DiffProviderType = "libre" | "word" | "aspose"

export class DiffFactory {
  static create(provider: DiffProviderType = "libre"): DiffProvider {
    switch (provider) {
      case "libre":
        return new LibreDiffProvider()

      case "word":
        // TODO: Implement Word-based diff provider
        throw new Error("Word diff provider not yet implemented")

      case "aspose":
        // TODO: Implement Aspose diff provider
        throw new Error("Aspose diff provider not yet implemented")

      default:
        throw new Error(`Unknown diff provider: ${provider}`)
    }
  }

  static async getAvailableProviders(): Promise<DiffProviderType[]> {
    const providers: DiffProviderType[] = []

    // Check Libre
    try {
      const libre = new LibreDiffProvider()
      if (await libre.isAvailable()) {
        providers.push("libre")
      }
    } catch (error) {
      console.error("[Diff Factory] Libre not available:", error)
    }

    // TODO: Check other providers

    return providers
  }
}
