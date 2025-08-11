import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl

  // Admin subdomain handling
  if (request.nextUrl.hostname === "sg44admin.gurusingapore.com") {
    const url = request.nextUrl.clone()
    url.hostname = "gurusingapore.com"
    url.pathname = `/admin${pathname}`
    return NextResponse.rewrite(url)
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    // Allow auth routes
    if (pathname.startsWith("/admin/auth/")) {
      return response
    }

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
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
