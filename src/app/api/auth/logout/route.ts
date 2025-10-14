import type { NextRequest } from "next/server"
import { handleApiError } from "@/lib/utils/errors"
import { lucia, validateRequest } from "@/lib/auth/lucia"

export async function POST(request: NextRequest) {
  try {
    const { session } = await validateRequest(request)
    if (session) {
      await lucia.invalidateSession(session.id)
    }
    const blank = lucia.createBlankSessionCookie()
    return new Response(null, { status: 204, headers: { "Set-Cookie": blank.serialize() } })
  } catch (error) {
    return handleApiError(error)
  }
}
