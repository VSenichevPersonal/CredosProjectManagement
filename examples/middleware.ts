/**
 * @intent: Next.js middleware for auth and tenant context
 * @llm-note: Runs on every request before route handlers
 * @architecture: Middleware layer - auth → tenant → route
 * @performance: Optimized with early exits for static resources
 */

import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for Next.js internals, static files, and API routes
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // Skip auth check for public pages (landing, auth pages)
  if (pathname.startsWith("/landing") || pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  const response = await updateSession(request)

  // Add tenant info to response headers for client access
  // This will be populated by updateSession from user data
  const tenantId = request.cookies.get("tenant_id")?.value

  if (tenantId && response) {
    response.headers.set("x-tenant-id", tenantId)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
