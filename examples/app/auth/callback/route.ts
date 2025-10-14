import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"

  logger.info("[Auth Callback] Processing auth callback", { code: !!code, next })

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error("[Auth Callback] Error exchanging code for session", error)
      return NextResponse.redirect(new URL("/auth/error?error=" + encodeURIComponent(error.message), requestUrl.origin))
    }

    logger.info("[Auth Callback] Successfully exchanged code for session, redirecting to dashboard")
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin))
}
