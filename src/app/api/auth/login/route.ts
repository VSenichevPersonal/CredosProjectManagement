import type { NextRequest } from "next/server"
import { LuciaAuthProvider } from "@/providers/auth/lucia-auth-provider"
import { handleApiError } from "@/lib/utils/errors"
import { lucia } from "@/lib/auth/lucia"

const provider = new LuciaAuthProvider()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return Response.json({ error: "email и password обязательны" }, { status: 400 })
    }
    const { user, sessionId } = await provider.login(email, password)
    const sessionCookie = lucia.createSessionCookie(sessionId)
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "Set-Cookie": sessionCookie.serialize() }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
