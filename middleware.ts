import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Rate limiting store (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 100 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

// Security headers
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com *.google-analytics.com *.gstatic.com;
    style-src 'self' 'unsafe-inline' fonts.googleapis.com;
    font-src 'self' fonts.gstatic.com;
    img-src 'self' data: https: *.supabase.co *.googleusercontent.com *.google-analytics.com *.gstatic.com;
    connect-src 'self' *.supabase.co *.google-analytics.com wss://*.supabase.co https://*.google-analytics.com;
    frame-src 'self' *.youtube.com *.vimeo.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),

  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const now = Date.now()
    const userKey = `${ip}-${pathname}`

    const userLimit = rateLimit.get(userKey) || {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    }

    // Reset counter if window has passed
    if (now > userLimit.resetTime) {
      userLimit.count = 0
      userLimit.resetTime = now + RATE_LIMIT_WINDOW
    }

    // Check rate limit
    if (userLimit.count >= RATE_LIMIT) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((userLimit.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString()
          }
        }
      )
    }

    userLimit.count++
    rateLimit.set(userKey, userLimit)

    // Clean up old entries every 100 requests
    if (Math.random() < 0.01) {
      for (const [key, value] of rateLimit.entries()) {
        if (now > value.resetTime) {
          rateLimit.delete(key)
        }
      }
    }
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
    const adminToken = request.cookies.get('admin_session')

    if (!adminToken) {
      // Fallback to PIN verification cookie
      const pinCookie = request.cookies.get('admin-pin-verified')?.value
      let pinVerified = false

      if (pinCookie) {
        try {
          const { payload } = await jwtVerify(pinCookie, JWT_SECRET)
          pinVerified = payload.verified === true
        } catch {
          pinVerified = false
        }
      }

      if (!pinVerified) {
        const url = new URL('/auth/admin-pin', request.url)
        // Preserve intended destination
        url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
        return NextResponse.redirect(url)
      }
    }
  }

  // PWA route handling
  if (pathname === '/sw.js') {
    return NextResponse.next()
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add additional headers
  response.headers.set('X-Request-ID', crypto.randomUUID())

  // PWA headers for manifest and service worker
  if (pathname === '/manifest.json') {
    response.headers.set('Content-Type', 'application/manifest+json')
  }

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_DOMAIN || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
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
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}