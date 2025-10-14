import type { NextRequest } from "next/server"
import { lucia, validateRequest, pool } from "@/lib/auth/lucia"
import type { AuthProvider, AuthUser } from "./auth-provider.interface"
// Пароль проверяется через lucia.useKey, отдельный hash не требуется здесь

export class LuciaAuthProvider implements AuthProvider {
  async getUserFromRequest(request: NextRequest) {
    const { user } = await validateRequest(request)
    if (!user) return null
    const row = await pool.query("select email, created_at from auth.\"user\" where id = $1", [user.id])
    const email = row.rows[0]?.email || ""
    const createdAt = row.rows[0]?.created_at || new Date().toISOString()
    return { id: user.id, email, createdAt } satisfies AuthUser
  }

  async register(email: string, password: string) {
    const exists = await pool.query("select id from auth.\"user\" where email = $1", [email])
    if (exists.rowCount && exists.rowCount > 0) throw new Error("Пользователь уже существует")
    // bcryptjs (чистый JS)
    const { hashSync } = await import("bcryptjs")
    const hashed = hashSync(password, 10)
    const inserted = await pool.query(
      "insert into auth.\"user\"(email, encrypted_password) values($1, $2) returning id, created_at",
      [email, hashed]
    )
    const userId = inserted.rows[0].id as string
    const createdAt = inserted.rows[0].created_at as string
    return { id: userId, email, createdAt } satisfies AuthUser
  }

  async login(email: string, password: string) {
    const row = await pool.query("select id, encrypted_password, created_at from auth.\"user\" where email = $1", [email])
    if (!row.rowCount) throw new Error("Неверные учетные данные")
    const userId = row.rows[0].id as string
    const { compareSync } = await import("bcryptjs")
    const ok = compareSync(password, row.rows[0].encrypted_password)
    if (!ok) throw new Error("Неверные учетные данные")
    const session = await lucia.createSession(userId, {})
    return { user: { id: userId, email, createdAt: row.rows[0].created_at }, sessionId: session.id }
  }

  async logout(_request: NextRequest) {
    // Удаляем сессию на основе cookie в middleware/route
    // Реализуется в /api/auth/logout
  }
}
