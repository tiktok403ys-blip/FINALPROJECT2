import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from './lib/supabase/server'
import { logger } from './lib/logger'
import { minimalSecurity } from './lib/security/minimal-security'

// Generate cryptographically secure nonce
function generateNonce(): string {
  const array = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Remove JWT_SECRET as we're using Supabase auth

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Create response
  const response = NextResponse.next()

  // Simple rate limiting check (no complex logic)
  try {
    const rateLimitResult = minimalSecurity.checkRateLimit(ip, 100, 15 * 60 * 1000)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Apply rate limit headers
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())

  } catch (error) {
    // If rate limiting fails, continue without it
    logger.warn('Rate limiting failed, continuing without rate limiting', {
      component: 'middleware',
      action: 'rate-limit-error',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error', path: pathname }
    })
  }

  // Admin route protection using Supabase auth
  if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      let isAuthenticated = false
      
      if (!error && user) {
        // Check if user is in admin_users table
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()
        
        isAuthenticated = !!adminUser
      }
      
      if (!isAuthenticated) {
        const url = new URL('/admin/login', request.url)
        // Preserve intended destination
        url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If auth check fails, redirect to login
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  // PWA route handling
  if (pathname === '/sw.js') {
    return NextResponse.next()
  }

  // Apply minimal security headers (no CSP, no complex features)
  const securityContext = minimalSecurity.getSecurityContext(request)
  minimalSecurity.applyHeaders(request, response, securityContext)

  // Add request tracking
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)
  
  // Log security context for monitoring
  logger.info('Minimal security headers applied successfully', {
    component: 'middleware',
    action: 'apply-security-headers',
    metadata: {
      path: pathname,
      context: securityContext.type,
      requestId,
      userAgent: request.headers.get('user-agent')?.substring(0, 100),
      ip: ip
    }
  })

  // PWA headers for manifest and service worker
  if (pathname === '/manifest.json') {
    response.headers.set('Content-Type', 'application/manifest+json')
    response.headers.set('Cache-Control', 'public, max-age=86400') // 24 hours
  }
  
  if (pathname === '/sw.js') {
    response.headers.set('Content-Type', 'application/javascript')
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Service-Worker-Allowed', '/')
  }

  // Enhanced CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const allowedOrigins = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'http://localhost:3000'
    const origin = request.headers.get('origin')
    
    // More restrictive CORS for production
    if (process.env.NODE_ENV === 'production') {
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
    } else {
      // Allow localhost in development
      response.headers.set('Access-Control-Allow-Origin', origin || allowedOrigins)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
    response.headers.set('Vary', 'Origin')
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