import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Compatible Content Security Policy
 * Designed to work with Next.js without blocking essential scripts
 */

export interface CSPConfig {
  nonce?: string
  isDevelopment?: boolean
  isProduction?: boolean
}

export class NextJSCompatibleCSP {
  private static generateNonce(): string {
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

  /**
   * Generate CSP directives that are compatible with Next.js
   */
  static generateCSPDirectives(config: CSPConfig = {}): string {
    const nonce = config.nonce || this.generateNonce()
    const isDev = config.isDevelopment ?? process.env.NODE_ENV === 'development'
    const isProd = config.isProduction ?? process.env.NODE_ENV === 'production'

    const directives = {
      // Default source - allow same origin
      'default-src': ["'self'"],
      
      // Script sources - allow Next.js, inline scripts, and external analytics
      'script-src': [
        "'self'",
        "'unsafe-eval'", // Required for Next.js development
        "'unsafe-inline'", // Required for Next.js inline scripts
        `'nonce-${nonce}'`, // Allow nonce-based scripts
        // Next.js specific domains
        "localhost:*",
        "127.0.0.1:*",
        // Google services
        "www.googletagmanager.com",
        "www.google-analytics.com",
        "googletagmanager.com",
        "*.googletagmanager.com",
        "*.google-analytics.com",
        "analytics.google.com",
        "*.analytics.google.com",
        "tagmanager.google.com",
        "*.doubleclick.net",
        // Supabase
        "*.supabase.co",
        "*.supabase.com",
        // Development tools
        ...(isDev ? ["'unsafe-eval'", "localhost:*", "127.0.0.1:*"] : []),
        // WebAssembly support
        "'wasm-unsafe-eval'"
      ],
      
      // Style sources - allow CSS and inline styles
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS
        "fonts.googleapis.com",
        "fonts.gstatic.com",
        "localhost:*",
        "127.0.0.1:*"
      ],
      
      // Font sources
      'font-src': [
        "'self'",
        "fonts.googleapis.com",
        "fonts.gstatic.com",
        "data:", // For base64 encoded fonts
        "localhost:*",
        "127.0.0.1:*"
      ],
      
      // Image sources
      'img-src': [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "localhost:*",
        "127.0.0.1:*",
        // Google services
        "*.googletagmanager.com",
        "*.google-analytics.com",
        "*.doubleclick.net",
        // Supabase storage
        "*.supabase.co",
        "*.supabase.com",
        // CDN services
        "*.cloudflare.com",
        "*.cloudfront.net",
        "*.amazonaws.com"
      ],
      
      // Connect sources - for API calls and WebSocket
      'connect-src': [
        "'self'",
        // Google Analytics
        "www.google-analytics.com",
        "*.googletagmanager.com",
        "*.google-analytics.com",
        "analytics.google.com",
        "*.analytics.google.com",
        "stats.g.doubleclick.net",
        // Supabase
        "*.supabase.co",
        "*.supabase.com",
        "wss://*.supabase.co",
        "wss://*.supabase.com",
        // Development
        ...(isDev ? ["localhost:*", "127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*"] : [])
      ],
      
      // Frame sources - for embedded content
      'frame-src': [
        "'self'",
        "www.google.com",
        "www.youtube.com",
        "player.vimeo.com",
        "www.googletagmanager.com",
        "localhost:*",
        "127.0.0.1:*"
      ],
      
      // Worker sources
      'worker-src': ["'self'", "blob:"],
      
      // Manifest source
      'manifest-src': ["'self'"],
      
      // Object source - block potentially dangerous objects
      'object-src': ["'none'"],
      
      // Base URI - restrict base tag
      'base-uri': ["'self'"],
      
      // Form action - restrict form submissions
      'form-action': ["'self'"],
      
      // Frame ancestors - prevent clickjacking
      'frame-ancestors': ["'none'"],
      
      // Upgrade insecure requests - force HTTPS in production
      ...(isProd ? { 'upgrade-insecure-requests': [] } : {}),
      
      // Block mixed content in production
      ...(isProd ? { 'block-all-mixed-content': [] } : {})
    }

    // Convert directives to CSP string
    return Object.entries(directives)
      .map(([directive, sources]) => {
        if (Array.isArray(sources) && sources.length === 0) {
          return directive
        }
        return `${directive} ${sources.join(' ')}`
      })
      .join('; ')
  }

  /**
   * Generate security headers that don't interfere with Next.js
   */
  static generateSecurityHeaders(config: CSPConfig = {}): Record<string, string> {
    const nonce = config.nonce || this.generateNonce()
    const isProd = config.isProduction ?? process.env.NODE_ENV === 'production'

    return {
      // Content Security Policy
      'Content-Security-Policy': this.generateCSPDirectives({ ...config, nonce }),
      
      // Basic security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // HSTS - only in production
      ...(isProd ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' } : {}),
      
      // Permissions Policy - modern replacement for Feature Policy
      'Permissions-Policy': [
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
      ].join(', '),
      
      // Additional security headers
      'X-Download-Options': 'noopen',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-DNS-Prefetch-Control': 'off',
      
      // Cache control for sensitive pages
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      
      // Hide server information
      'Server': '',
      'X-Powered-By': ''
    }
  }

  /**
   * Apply CSP middleware to Next.js response
   */
  static applyCSPMiddleware(request: NextRequest, response: NextResponse): NextResponse {
    const nonce = this.generateNonce()
    
    // Store nonce in response headers for use in components
    response.headers.set('X-Nonce', nonce)
    
    // Apply security headers
    const securityHeaders = this.generateSecurityHeaders({ nonce })
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value)
      }
    })
    
    return response
  }

  /**
   * Get nonce from request headers
   */
  static getNonceFromRequest(request: NextRequest): string | null {
    return request.headers.get('x-nonce')
  }

  /**
   * Validate nonce format
   */
  static isValidNonce(nonce: string): boolean {
    return /^[a-f0-9]{32}$/i.test(nonce)
  }
}

// Export default instance
export const nextjsCSP = NextJSCompatibleCSP
export default NextJSCompatibleCSP
