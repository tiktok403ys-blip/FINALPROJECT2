import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

  // Check if this is the admin subdomain
  if (hostname === "sg44admin.gurusingapore.com") {
    console.log("🔄 Admin subdomain detected, routing to /admin")

    // Rewrite to admin path
    url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Block direct access to /admin on main domain
  if (url.pathname.startsWith("/admin") && hostname !== "sg44admin.gurusingapore.com") {
    console.log("🚫 Direct admin access blocked, redirecting to subdomain")

    // Redirect to admin subdomain
    const adminUrl = new URL(url.pathname, "https://sg44admin.gurusingapore.com")
    return NextResponse.redirect(adminUrl)
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
