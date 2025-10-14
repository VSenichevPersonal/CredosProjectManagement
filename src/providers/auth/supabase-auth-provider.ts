import type { NextRequest } from "next/server"
import type { AuthProvider, AuthUser } from "./auth-provider.interface"

export class SupabaseAuthProvider implements AuthProvider {
  async getUserFromRequest(_request: NextRequest): Promise<AuthUser | null> {
    throw new Error("SupabaseAuthProvider not implemented")
  }
  async register(_email: string, _password: string): Promise<AuthUser> {
    throw new Error("SupabaseAuthProvider not implemented")
  }
  async login(_email: string, _password: string): Promise<{ user: AuthUser; sessionId: string }> {
    throw new Error("SupabaseAuthProvider not implemented")
  }
  async logout(_request: NextRequest): Promise<void> {
    throw new Error("SupabaseAuthProvider not implemented")
  }
}
