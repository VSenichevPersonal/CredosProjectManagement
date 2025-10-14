/**
 * @intent: Factory for creating database providers
 * @architecture: Follows examples pattern - centralized provider creation
 * @llm-note: Similar to LLMFactory pattern - enables switching between providers
 */

import type { DatabaseProvider } from './database-provider.interface'
import { SimpleProvider } from './simple-provider'

export type DatabaseProviderType = "simple" | "supabase" | "mock"

export class ProviderFactory {
  static create(provider: DatabaseProviderType = "simple"): DatabaseProvider {
    switch (provider) {
      case "simple":
        return new SimpleProvider()

      case "supabase":
        // TODO: Implement Supabase provider
        throw new Error("Supabase provider not yet implemented")

      case "mock":
        // TODO: Implement Mock provider for testing
        throw new Error("Mock provider not yet implemented")

      default:
        throw new Error(`Unknown database provider: ${provider}`)
    }
  }

  static async getAvailableProviders(): Promise<DatabaseProviderType[]> {
    const providers: DatabaseProviderType[] = []

    // Check Simple provider
    try {
      const simple = new SimpleProvider()
      // Simple provider is always available
      providers.push("simple")
    } catch (error) {
      console.error("[Provider Factory] Simple provider not available:", error)
    }

    // Check Supabase provider
    try {
      // TODO: Check if Supabase is configured
      // providers.push("supabase")
    } catch (error) {
      console.error("[Provider Factory] Supabase not available:", error)
    }

    // Check Mock provider
    try {
      // TODO: Check if Mock is available
      // providers.push("mock")
    } catch (error) {
      console.error("[Provider Factory] Mock not available:", error)
    }

    return providers
  }
}

// Singleton instance
let providerInstance: DatabaseProvider | null = null

export async function getDatabaseProvider(provider: DatabaseProviderType = "simple"): Promise<DatabaseProvider> {
  if (!providerInstance) {
    providerInstance = ProviderFactory.create(provider)
  }
  return providerInstance
}

export function setDatabaseProvider(provider: DatabaseProvider) {
  providerInstance = provider
}
