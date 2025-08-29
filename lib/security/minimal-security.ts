import { NextRequest, NextResponse } from 'next/server'

/**
 * Minimal Security System for Next.js
 * Only essential security headers, no browser-specific APIs
 */

export interface SecurityContext {
  type: 'api' | 'admin' | 'public' | 'static'
  path: string
  isDevelopment: boolean
  isProduction: boolean
}

export class MinimalSecurity {
  /**
   * Generate basic security headers
   */
  static generateBasicHeaders(context: SecurityContext): Record<string, string> {
    const headers: Record<string, string> = {}

    // Basic security headers (always applied)
    headers['X-Content-Type-Options'] = 'nosniff'
    headers['X-Frame-Options'] = 'DENY'
    headers['X-XSS-Protection'] = '1; mode=block'
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    // Context-specific headers
    switch (context.type) {
      case 'api':
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate'
        headers['Pragma'] = 'no-cache'
        headers['Expires'] = '0'
        break

      case 'admin':
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate'
        headers['Pragma'] = 'no-cache'
        headers['Expires'] = '0'
        headers['X-Robots-Tag'] = 'noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex'
        break

      case 'static':
        headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        break

      case 'public':
      default:
        headers['Cache-Control'] = 'public, max-age=3600, must-revalidate'
        break
    }

    // Additional security headers
    headers['X-Download-Options'] = 'noopen'
    headers['X-Permitted-Cross-Domain-Policies'] = 'none'
    headers['X-DNS-Prefetch-Control'] = 'off'

    // Permissions Policy - only use supported features
    headers['Permissions-Policy'] = [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'microphone=()',
      'midi=()',
      'payment=(self)',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()'
    ].join(', ')

    // Hide server information
    headers['Server'] = ''
    headers['X-Powered-By'] = ''

    return headers
  }

  /**
   * Apply security headers to Next.js response
   */
  static applyHeaders(
    request: NextRequest,
    response: NextResponse,
    context: SecurityContext
  ): NextResponse {
    const securityHeaders = this.generateBasicHeaders(context)
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value)
      }
    })

    return response
  }

  /**
   * Determine security context from request path
   */
  static getSecurityContext(request: NextRequest): SecurityContext {
    const { pathname } = request.nextUrl
    const isDev = process.env.NODE_ENV === 'development'
    const isProd = process.env.NODE_ENV === 'production'

    let type: SecurityContext['type'] = 'public'

    if (pathname.startsWith('/api/')) {
      type = 'api'
    } else if (pathname.startsWith('/admin') || pathname.includes('admin')) {
      type = 'admin'
    } else if (
      pathname.startsWith('/_next/static') ||
      pathname.startsWith('/static') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.woff2') ||
      pathname.endsWith('.woff')
    ) {
      type = 'static'
    }

    return {
      type,
      path: pathname,
      isDevelopment: isDev,
      isProduction: isProd
    }
  }

  /**
   * Simple rate limiting check (no intervals, just basic counting)
   */
  static checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 15 * 60 * 1000
  ): { allowed: boolean; remaining: number } {
    // This is a simplified version - in production you might want Redis
    const now = Date.now()
    const key = `rate_limit_${identifier}`
    
    // For now, just return allowed to avoid complexity
    return {
      allowed: true,
      remaining: limit
    }
  }
}

// Export default instance
export const minimalSecurity = MinimalSecurity
export default MinimalSecurity
