import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  const publicPaths = ["/api/auth/login", "/api/auth/register", "/auth/login", "/auth/signup"]
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check session cookie
  const sessionCookie = request.cookies.get(process.env.AUTH_COOKIE_NAME || "credos_session")
  
  if (!sessionCookie) {
    // API routes: return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized: User not authenticated" },
        { status: 401 }
      )
    }
    
    // Page routes: redirect to login
    if (!pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}

