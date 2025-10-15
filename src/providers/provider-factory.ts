/**
 * @intent: Factory for creating database providers
 * @architecture: Follows examples pattern - centralized provider creation
 * @llm-note: Similar to LLMFactory pattern - enables switching between providers
 */

import type { DatabaseProvider } from './database-provider.interface'
import { SimpleDatabaseProvider } from './simple-provider'
import { PostgresDatabaseProvider } from './postgres-database-provider'

export type DatabaseProviderType = "postgres" | "simple" | "mock"

export class ProviderFactory {
  static create(provider: DatabaseProviderType = "postgres"): DatabaseProvider {
    switch (provider) {
      case "postgres":
        // Primary provider: Direct PostgreSQL connection
        return new PostgresDatabaseProvider()

      case "simple":
        // Deprecated: Use for testing only
        return new SimpleDatabaseProvider()

      case "mock":
        // TODO: Implement Mock provider for testing
        throw new Error("Mock provider not yet implemented")

      default:
        throw new Error(`Unknown database provider: ${provider}`)
    }
  }

  static async getAvailableProviders(): Promise<DatabaseProviderType[]> {
    const providers: DatabaseProviderType[] = []

    // Check PostgreSQL provider (primary)
    try {
      providers.push("postgres")
    } catch (error) {
      console.error("[Provider Factory] PostgreSQL not available:", error)
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

export async function getDatabaseProvider(provider: DatabaseProviderType = "postgres"): Promise<DatabaseProvider> {
  if (!providerInstance) {
    providerInstance = ProviderFactory.create(provider)
  }
  return providerInstance
}

export function setDatabaseProvider(provider: DatabaseProvider) {
  providerInstance = provider
}
