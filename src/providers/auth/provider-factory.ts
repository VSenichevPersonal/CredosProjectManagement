import type { AuthProvider } from "./auth-provider.interface"
import { LuciaAuthProvider } from "./lucia-auth-provider"
import { SupabaseAuthProvider } from "./supabase-auth-provider"

export type AuthProviderType = "lucia" | "supabase"

let instance: AuthProvider | null = null

export function getAuthProvider(): AuthProvider {
  if (instance) return instance
  const provider = (process.env.AUTH_PROVIDER as AuthProviderType) || "lucia"
  switch (provider) {
    case "lucia":
      instance = new LuciaAuthProvider()
      return instance
    case "supabase":
      instance = new SupabaseAuthProvider()
      return instance
    default:
      instance = new LuciaAuthProvider()
      return instance
  }
}

export function setAuthProvider(auth: AuthProvider) {
  instance = auth
}
