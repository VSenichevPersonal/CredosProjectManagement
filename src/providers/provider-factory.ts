/**
 * @intent: Factory for creating database providers
 * @architecture: Follows examples pattern - centralized provider creation
 * @llm-note: Similar to LLMFactory pattern - enables switching between providers
 */

import type { DatabaseProvider } from './database-provider.interface'
import { SimpleDatabaseProvider } from './simple-provider'
import { SupabaseDatabaseProvider } from './supabase-database-provider'

export type DatabaseProviderType = "simple" | "supabase" | "mock"

export class ProviderFactory {
  static create(provider: DatabaseProviderType = "supabase"): DatabaseProvider {
    switch (provider) {
      case "simple":
        // Deprecated: Use for testing only
        return new SimpleDatabaseProvider()

      case "supabase":
        return new SupabaseDatabaseProvider()

      case "mock":
        // TODO: Implement Mock provider for testing
        throw new Error("Mock provider not yet implemented")

      default:
        throw new Error(`Unknown database provider: ${provider}`)
    }
  }

  static async getAvailableProviders(): Promise<DatabaseProviderType[]> {
    const providers: DatabaseProviderType[] = []

    // Check Supabase provider (primary)
    try {
      providers.push("supabase")
    } catch (error) {
      console.error("[Provider Factory] Supabase not available:", error)
    }

    // Check Simple provider (fallback/testing)
    try {
      providers.push("simple")
    } catch (error) {
      console.error("[Provider Factory] Simple provider not available:", error)
    }

    return providers
  }
}

// Singleton instance
let providerInstance: DatabaseProvider | null = null

export async function getDatabaseProvider(provider: DatabaseProviderType = "supabase"): Promise<DatabaseProvider> {
  if (!providerInstance) {
    providerInstance = ProviderFactory.create(provider)
  }
  return providerInstance
}

export function setDatabaseProvider(provider: DatabaseProvider) {
  providerInstance = provider
}
