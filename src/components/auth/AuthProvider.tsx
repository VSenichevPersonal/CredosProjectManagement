"use client"
import { createContext, useContext, useEffect, useState } from "react"

type AuthUser = { id: string; email: string; createdAt: string } | null

type AuthContextType = {
  user: AuthUser
  setUser: (u: AuthUser) => void
}

const Ctx = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setUser(d.user))
  }, [])

  return <Ctx.Provider value={{ user, setUser }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
