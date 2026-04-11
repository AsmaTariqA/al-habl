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
  const roomId = request.cookies.get("qf_room_id")?.value

  if (!userId) {
    if (pathname.startsWith("/api/circle")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const requiresRoom = pathname === "/circle" || pathname.startsWith("/circle/")
  if (requiresRoom && !roomId) {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/onboarding", "/circle/:path*", "/profile", "/api/circle/:path*"],
}
