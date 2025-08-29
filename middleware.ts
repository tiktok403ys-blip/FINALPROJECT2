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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Check if this is admin subdomain
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN || process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN || 'admin'
  const isAdminSubdomain = host.includes('sg44admin.gurusingapore.com') || host.startsWith(`${adminSubdomain}.`) || host === adminSubdomain

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

  // CRITICAL FIX: Block ALL /admin access on main domain for unauthorized users
  if (pathname.startsWith('/admin') && !isAdminSubdomain) {
    try {
      // Check if user is authenticated
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        // Return 404 for unauthorized users trying to access /admin
        logger.warn('Unauthorized access attempt to admin route', {
          component: 'middleware',
          action: 'block-unauthorized-admin-access',
          metadata: { path: pathname, ip, userAgent: request.headers.get('user-agent')?.substring(0, 100) }
        })
        return new NextResponse('Not Found', { status: 404 })
      }
      
      // Check if user has admin role
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, is_active, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      
      if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
        // Return 404 for non-admin users
        logger.warn('Non-admin user attempting to access admin route', {
          component: 'middleware',
          action: 'block-non-admin-access',
          metadata: { path: pathname, userId: user.id, ip }
        })
        return new NextResponse('Not Found', { status: 404 })
      }
      
      // If user is authenticated admin, redirect to admin subdomain
      const adminUrl = `https://sg44admin.gurusingapore.com${pathname}${request.nextUrl.search}`
      logger.info('Redirecting authenticated admin to admin subdomain', {
        component: 'middleware',
        action: 'redirect-admin-to-subdomain',
        metadata: { path: pathname, userId: user.id, role: adminUser.role }
      })
      return NextResponse.redirect(adminUrl)
      
    } catch (error) {
      // If auth check fails, return 404
      logger.error('Auth check failed for admin route', {
        component: 'middleware',
        action: 'auth-check-failed',
        metadata: { path: pathname, error: error instanceof Error ? error.message : 'Unknown error', ip }
      })
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  // Protect entire admin subdomain (not just /admin paths)
  if (isAdminSubdomain) {
    // Allow access to login page without authentication
    if (pathname.includes('/login') || pathname === '/admin/login') {
      // Continue to login page
    } else {
      // Require authentication and proper role for all other pages on admin subdomain
      try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        let isAuthorized = false
        
        if (!error && user) {
          // Check if user is in admin_users table with proper role
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('id, is_active, role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()
          
          // Only allow admin or super_admin roles
          isAuthorized = !!adminUser && (adminUser.role === 'admin' || adminUser.role === 'super_admin')
        }
        
        if (!isAuthorized) {
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