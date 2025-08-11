import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Admin subdomain handling
  if (hostname === "sg44admin.gurusingapore.com") {
    // If accessing admin subdomain but not admin path, rewrite to admin
    if (!pathname.startsWith("/admin")) {
      const adminPath = pathname === "/" ? "/admin" : `/admin${pathname}`
      return NextResponse.rewrite(new URL(adminPath, request.url))
    }

    // Add security headers for admin subdomain
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    return response
  }

  // Main domain handling - gurusingapore.com
  if (hostname === "gurusingapore.com") {
    // Allow admin access from main domain with security headers
    if (pathname.startsWith("/admin")) {
      // Check if user is authenticated
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = "/admin/auth/login"
        return NextResponse.redirect(url)
      }

      // Check if user has admin role
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
        const url = request.nextUrl.clone()
        url.pathname = "/admin/auth/login"
        return NextResponse.redirect(url)
      }

      // Add security headers for admin path on main domain
      response.headers.set("X-Robots-Tag", "noindex, nofollow")
      response.headers.set("X-Frame-Options", "DENY")
      response.headers.set("X-Content-Type-Options", "nosniff")
      return response
    }

    // Allow all other paths on main domain
    return NextResponse.next()
  }

  // For any other hostname, continue normally
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
