import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

function isPublicPath(pathname: string) {
  return pathname === "/" || pathname === "/auth/login" || pathname === "/auth/callback"
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const userId = request.cookies.get("qf_user_id")?.value

  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // ← removed roomId check entirely — let /circle page handle room fetching
  return NextResponse.next()
}

export const config = {
  matcher: ["/onboarding", "/circle/:path*", "/profile", "/api/circle/:path*"],
}