import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // Handle admin subdomain routing
  if (hostname === "sg44admin.gurusingapore.com") {
    // Rewrite to admin routes
    const adminPath = pathname === "/" ? "/admin" : `/admin${pathname}`
    return NextResponse.rewrite(new URL(adminPath, request.url))
  }

  // Prevent direct access to /admin routes on main domain
  if (pathname.startsWith("/admin") && hostname !== "sg44admin.gurusingapore.com") {
    // Redirect to admin subdomain
    const adminUrl = new URL(pathname.replace("/admin", ""), "https://sg44admin.gurusingapore.com")
    return NextResponse.redirect(adminUrl)
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

  // Refresh session if expired - required for Server Components
  try {
    await supabase.auth.getUser()
  } catch (error) {
    console.error("Middleware auth error:", error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
