import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { AdminAuth } from "./lib/auth/admin-auth"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Handle subdomain routing for admin panel
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN || "sg44admin.gurusingapore.com"

  // Check if this is the admin subdomain
  if (hostname === adminSubdomain) {
    // Validate admin session and role for admin subdomain access
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user has admin role
    const adminAuth = AdminAuth.getInstance()
    await adminAuth.getCurrentUser() // Initialize admin auth with current user
    const isAdmin = adminAuth.isAdmin()
    
    if (!isAdmin) {
      // Return 403 if user is not admin
      console.log(`🚫 Non-admin user ${user.email} attempted to access admin subdomain`)
      return new NextResponse("Forbidden: Admin access required", { status: 403 })
    }

    // Log admin access
    await adminAuth.logAdminAction(
      'admin_subdomain_access',
      'middleware',
      undefined,
      {
        hostname,
        pathname: url.pathname,
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    )

    // Only rewrite the root path "/" to "/admin".
    // Keep requests to existing "/admin/*", "/api/*", etc. unchanged.
    if (url.pathname === "/") {
      url.pathname = "/admin"
      return NextResponse.rewrite(url)
    }
  }

  // STRICT: Block ANY direct access to /admin on main domain with 404 (no redirect)
  if (
    hostname !== adminSubdomain &&
    url.pathname.startsWith("/admin")
  ) {
    console.log("🚫 Direct admin path on main domain blocked with 404")
    return new NextResponse(null, { status: 404 })
  }

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
