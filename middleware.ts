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

  // Admin subdomain security
  if (hostname === "sg44admin.gurusingapore.com") {
    // Allow admin subdomain to access admin routes
    if (!pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url))
    }

    // Add security headers for admin subdomain
    const response = NextResponse.next()
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    return response
  }

  // Block admin access from main domain
  if (pathname.startsWith("/admin")) {
    return new NextResponse(null, { status: 404 })
  }

  // Admin subdomain routing - ONLY allow admin access from subdomain
  if (hostname === "sg44admin.gurusingapore.com") {
    // Rewrite admin subdomain to /admin path
    if (!pathname.startsWith("/admin")) {
      const url = new URL(`/admin${pathname === "/" ? "" : pathname}`, request.url)
      return NextResponse.rewrite(url)
    }
  }

  // Main domain routing
  if (hostname === "gurusingapore.com" || hostname === "www.gurusingapore.com") {
    // Redirect www to non-www
    if (hostname === "www.gurusingapore.com") {
      const url = new URL(`https://gurusingapore.com${pathname}`, request.url)
      return NextResponse.redirect(url, 301)
    }
  }

  return NextResponse.next()
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
