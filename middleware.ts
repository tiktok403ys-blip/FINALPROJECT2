import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")
  const pathname = request.nextUrl.pathname

  // Admin subdomain security
  if (hostname === "sg44admin.gurusingapore.com") {
    // Enhanced security for admin subdomain
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if user is admin
    if (!user) {
      return NextResponse.redirect(new URL("/admin/auth/login", request.url))
    }

    // Check admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    // Rewrite admin subdomain to /admin path
    if (!pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url))
    }
  }

  // Main domain routing
  if (hostname === "gurusingapore.com" || hostname === "www.gurusingapore.com") {
    // Redirect www to non-www
    if (hostname === "www.gurusingapore.com") {
      return NextResponse.redirect(new URL(`https://gurusingapore.com${pathname}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
