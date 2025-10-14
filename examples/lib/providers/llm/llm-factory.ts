import type { LLMProvider } from "./llm-provider.interface"
import { OpenAIProvider } from "./openai-provider"
import { AnthropicProvider } from "./anthropic-provider"

export type LLMProviderType = "openai" | "anthropic" | "grok" | "local"

export class LLMFactory {
  static create(provider: LLMProviderType = "openai", model?: string): LLMProvider {
    switch (provider) {
      case "openai":
        return new OpenAIProvider(model || "gpt-4o")

      case "anthropic":
        return new AnthropicProvider(model || "claude-sonnet-4.5")

      case "grok":
        // TODO: Implement Grok provider
        throw new Error("Grok provider not yet implemented")

      case "local":
        // TODO: Implement Local LLM provider
        throw new Error("Local LLM provider not yet implemented")

      default:
        throw new Error(`Unknown LLM provider: ${provider}`)
    }
  }

  static async getAvailableProviders(): Promise<LLMProviderType[]> {
    const providers: LLMProviderType[] = []

    // Check OpenAI
    try {
      const openai = new OpenAIProvider()
      if (await openai.isAvailable()) {
        providers.push("openai")
      }
    } catch (error) {
      console.error("[LLM Factory] OpenAI not available:", error)
    }

    // Check Anthropic
    try {
      const anthropic = new AnthropicProvider()
      if (await anthropic.isAvailable()) {
        providers.push("anthropic")
      }
    } catch (error) {
      console.error("[LLM Factory] Anthropic not available:", error)
    }

    // TODO: Check other providers

    return providers
  }
}
