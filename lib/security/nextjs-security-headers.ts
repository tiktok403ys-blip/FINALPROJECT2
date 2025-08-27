import { NextRequest, NextResponse } from 'next/server'
import { NextJSCompatibleCSP } from './nextjs-compatible-csp'

/**
 * Next.js Compatible Security Headers
 * Provides security without interfering with Next.js functionality
 */

export interface SecurityContext {
  type: 'api' | 'admin' | 'public' | 'static'
  path: string
  isDevelopment: boolean
  isProduction: boolean
}

export interface SecurityHeadersConfig {
  context: SecurityContext
  nonce?: string
  enableCSP?: boolean
  enableHSTS?: boolean
  enablePermissionsPolicy?: boolean
}

export class NextJSSecurityHeaders {
  /**
   * Generate security headers based on context
   */
  static generateHeaders(config: SecurityHeadersConfig): Record<string, string> {
    const { context, nonce, enableCSP = true, enableHSTS = true, enablePermissionsPolicy = true } = config
    
    const headers: Record<string, string> = {}

    // Basic security headers (always applied)
    headers['X-Content-Type-Options'] = 'nosniff'
    headers['X-Frame-Options'] = 'DENY'
    headers['X-XSS-Protection'] = '1; mode=block'
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    // Content Security Policy
    if (enableCSP) {
      const cspConfig = {
        nonce,
        isDevelopment: context.isDevelopment,
        isProduction: context.isProduction
      }
      headers['Content-Security-Policy'] = NextJSCompatibleCSP.generateCSPDirectives(cspConfig)
    }

    // HSTS - only in production and for non-static content
    if (enableHSTS && context.isProduction && context.type !== 'static') {
      headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
    }

    // Permissions Policy
    if (enablePermissionsPolicy) {
      headers['Permissions-Policy'] = this.generatePermissionsPolicy(context)
    }

    // Context-specific headers
    switch (context.type) {
      case 'api':
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate'
        headers['Pragma'] = 'no-cache'
        headers['Expires'] = '0'
        headers['Cross-Origin-Resource-Policy'] = 'same-origin'
        headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        break

      case 'admin':
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate'
        headers['Pragma'] = 'no-cache'
        headers['Expires'] = '0'
        headers['X-Robots-Tag'] = 'noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex'
        headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        headers['Cross-Origin-Resource-Policy'] = 'same-origin'
        break

      case 'static':
        headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
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

    // Hide server information
    headers['Server'] = ''
    headers['X-Powered-By'] = ''

    return headers
  }

  /**
   * Generate Permissions Policy based on context
   */
  private static generatePermissionsPolicy(context: SecurityContext): string {
    const basePolicy = [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=(self)',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ]

    // Admin context gets more permissions
    if (context.type === 'admin') {
      return basePolicy
        .map(policy => {
          if (policy.includes('fullscreen')) return 'fullscreen=(self)'
          if (policy.includes('payment')) return 'payment=(self)'
          return policy
        })
        .join(', ')
    }

    // Public context gets restricted permissions
    return basePolicy
      .map(policy => {
        if (policy.includes('fullscreen')) return 'fullscreen=()'
        if (policy.includes('payment')) return 'payment=()'
        if (policy.includes('geolocation')) return 'geolocation=()'
        if (policy.includes('camera')) return 'camera=()'
        if (policy.includes('microphone')) return 'microphone=()'
        return policy
      })
      .join(', ')
  }

  /**
   * Apply security headers to Next.js response
   */
  static applyHeaders(
    request: NextRequest,
    response: NextResponse,
    context: SecurityContext
  ): NextResponse {
    const nonce = NextJSCompatibleCSP.getNonceFromRequest(request) || 
                  request.headers.get('x-nonce') || 
                  undefined

    const config: SecurityHeadersConfig = {
      context,
      nonce,
      enableCSP: true,
      enableHSTS: context.isProduction,
      enablePermissionsPolicy: true
    }

    const securityHeaders = this.generateHeaders(config)
    
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
    } else if (pathname.startsWith('/admin')) {
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
   * Create a simple security middleware
   */
  static createMiddleware() {
    return function securityMiddleware(request: NextRequest, response: NextResponse) {
      const context = NextJSSecurityHeaders.getSecurityContext(request)
      return NextJSSecurityHeaders.applyHeaders(request, response, context)
    }
  }
}

// Export default instance and middleware
export const nextjsSecurityHeaders = NextJSSecurityHeaders
export const createSecurityMiddleware = NextJSSecurityHeaders.createMiddleware()
export default NextJSSecurityHeaders
