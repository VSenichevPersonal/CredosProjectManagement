import { Lucia } from "lucia"
import { Pool } from "pg"
import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const lucia = new Lucia(new NodePostgresAdapter(pool, {
  user: "auth.user",
  session: "auth.session"
}), {
  sessionCookie: {
    name: process.env.AUTH_COOKIE_NAME || "credos_session",
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    }
  },
  getUserAttributes: (data: any) => {
    return {
      email: data.email as string,
      createdAt: (data.created_at as string) ?? new Date().toISOString()
    }
  }
})

export type LuciaInstance = typeof lucia

export async function validateRequest(request: NextRequest) {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(process.env.AUTH_COOKIE_NAME || "credos_session")?.value
  if (!cookie) return { user: null, session: null }
  const { user, session } = await lucia.validateSession(cookie).catch(() => ({ user: null, session: null }))
  return { user, session }
}
