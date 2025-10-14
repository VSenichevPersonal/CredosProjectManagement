import type { NextRequest } from "next/server"

export interface AuthUser {
  id: string
  email: string
  createdAt: string
}

export interface AuthSession {
  id: string
  userId: string
  expiresAt: string
  createdAt: string
}

export interface AuthProvider {
  getUserFromRequest(request: NextRequest): Promise<AuthUser | null>
  register(email: string, password: string): Promise<AuthUser>
  login(email: string, password: string): Promise<{ user: AuthUser; sessionId: string }>
  logout(request: NextRequest): Promise<void>
}
