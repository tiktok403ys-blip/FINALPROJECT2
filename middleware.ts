import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { enhancedCSPMiddleware } from './lib/security/csp-utils'
import { getEnhancedSecurityHeaders } from './lib/security'
import { logger } from './lib/logger'
import { 
  persistentApiRateLimiter, 
  persistentAdminRateLimiter, 
  persistentStrictRateLimiter 
} from './lib/security/persistent-rate-limiter'
import { getRateLimitConfig } from './lib/config/env-validator'

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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Block Vite development server requests to reduce noise
  if (pathname.startsWith('/@vite/') || 
      pathname === '/@vite/client' ||
      pathname.startsWith('/@fs/') ||
      pathname.startsWith('/__vite') ||
      pathname.includes('vite.svg') ||
      pathname.includes('hot-update')) {
    // Return a clean 404 response without logging
    return new NextResponse(null, { 
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }

  // Apply persistent rate limiting based on route type (only if enabled)
  let rateLimitResponse: NextResponse | null = null
  
  try {
    const rateLimitConfig = getRateLimitConfig()
    
    if (rateLimitConfig.enabled) {
      if (pathname.startsWith('/api/admin')) {
        // Strict rate limiting for admin API routes
        rateLimitResponse = await persistentStrictRateLimiter(request)
      } else if (pathname.startsWith('/admin')) {
        // Admin panel rate limiting
        rateLimitResponse = await persistentAdminRateLimiter(request)
      } else if (pathname.startsWith('/api/')) {
        // General API rate limiting
        rateLimitResponse = await persistentApiRateLimiter(request)
      }
      
      // If rate limit exceeded, return the rate limit response
      if (rateLimitResponse) {
        return rateLimitResponse
      }
    } else {
      // Rate limiting is disabled for development
      logger.info('Rate limiting disabled', {
        component: 'middleware',
        action: 'skip-rate-limiting',
        metadata: { path: pathname, ip }
      })
    }
  } catch (error) {
    // If rate limit config fails, continue without rate limiting
    logger.warn('Rate limit configuration failed, continuing without rate limiting', {
      component: 'middleware',
      action: 'rate-limit-config-error',
      metadata: { path: pathname, error: error instanceof Error ? error.message : 'Unknown error' }
    })
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

  // Apply enhanced CSP middleware
  const response = enhancedCSPMiddleware(request)

  // Determine security context based on path
  let securityContext: 'api' | 'admin' | 'public' | 'static' = 'public'
  
  if (pathname.startsWith('/api/')) {
    securityContext = 'api'
  } else if (pathname.startsWith('/admin')) {
    securityContext = 'admin'
  } else if (pathname.startsWith('/_next/static') || pathname.startsWith('/static') || 
             pathname.endsWith('.js') || pathname.endsWith('.css') || 
             pathname.endsWith('.png') || pathname.endsWith('.jpg') || 
             pathname.endsWith('.jpeg') || pathname.endsWith('.webp') || 
             pathname.endsWith('.svg') || pathname.endsWith('.ico')) {
    securityContext = 'static'
  }

  // Apply enhanced security headers based on context
  const securityHeaders = getEnhancedSecurityHeaders(securityContext)
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) { // Only set non-empty values
      response.headers.set(key, value)
    }
  })

  // Add request tracking
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)
  
  // Log security context for monitoring (exclude static assets and common noise)
  const shouldLog = !pathname.startsWith('/_next/static') && 
                   !pathname.startsWith('/_next/image') && 
                   !pathname.endsWith('.ico') && 
                   !pathname.endsWith('.png') && 
                   !pathname.endsWith('.jpg') && 
                   !pathname.endsWith('.jpeg') && 
                   !pathname.endsWith('.webp') && 
                   !pathname.endsWith('.svg') && 
                   !pathname.endsWith('.css') && 
                   !pathname.endsWith('.js') &&
                   !pathname.includes('hot-update') &&
                   securityContext !== 'static'
  
  if (shouldLog) {
    logger.info('Security headers applied', {
      component: 'middleware',
      action: 'apply-security-headers',
      metadata: {
        path: pathname,
        context: securityContext,
        requestId,
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        ip: ip
      }
    })
  }

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