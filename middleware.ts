import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  try {
    // Admin subdomain handling
    if (hostname === "sg44admin.gurusingapore.com") {
      // If accessing admin subdomain but not admin path, rewrite to admin
      if (!pathname.startsWith("/admin")) {
        const adminPath = pathname === "/" ? "/admin" : `/admin${pathname}`
        return NextResponse.rewrite(new URL(adminPath, request.url))
      }

      // Add security headers for admin subdomain
      const response = NextResponse.next()
      response.headers.set("X-Robots-Tag", "noindex, nofollow")
      response.headers.set("X-Frame-Options", "DENY")
      response.headers.set("X-Content-Type-Options", "nosniff")
      return response
    }

    // Main domain handling
    if (hostname === "gurusingapore.com" || hostname === "www.gurusingapore.com") {
      // Block admin access from main domain
      if (pathname.startsWith("/admin")) {
        return new NextResponse(null, { status: 404 })
      }

      // Redirect www to non-www (only if it's www)
      if (hostname === "www.gurusingapore.com") {
        const url = new URL(request.url)
        url.hostname = "gurusingapore.com"
        return NextResponse.redirect(url, 301)
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
