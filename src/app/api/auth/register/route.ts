import type { NextRequest } from "next/server"
import { LuciaAuthProvider } from "@/providers/auth/lucia-auth-provider"
import { handleApiError } from "@/lib/utils/errors"

const provider = new LuciaAuthProvider()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return Response.json({ error: "email и password обязательны" }, { status: 400 })
    }
    const user = await provider.register(email, password)
    return Response.json({ user }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
