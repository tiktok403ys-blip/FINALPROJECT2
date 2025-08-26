// Security Configuration for Mobile-First App
// Comprehensive security headers and CSP implementation

import { NextRequest, NextResponse } from 'next/server'

// Security Configuration
export const SECURITY_CONFIG = {
  // Content Security Policy - Compatible with Next.js while maintaining security
  csp: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'strict-dynamic'", // Allows scripts loaded by trusted scripts
      "'unsafe-eval'", // Required for Next.js webpack and development
      "'unsafe-inline'", // Required for Next.js inline scripts
      "www.googletagmanager.com",
      "www.google-analytics.com",
      "googletagmanager.com",
      "*.googletagmanager.com",
      "'wasm-unsafe-eval'" // Required for WebAssembly
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and Next.js styles
      "fonts.googleapis.com",
      "fonts.gstatic.com"
    ],
    'font-src': [
      "'self'",
      "fonts.googleapis.com",
      "fonts.gstatic.com",
      "data:" // For base64 encoded fonts
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "*.googletagmanager.com",
      "*.google-analytics.com",
      "*.supabase.co",
      "*.supabase.com",
      "*.cloudflare.com",
      "*.cloudfront.net",
      "*.amazonaws.com"
    ],
    'connect-src': [
      "'self'",
      "www.google-analytics.com",
      "*.googletagmanager.com",
      "*.google-analytics.com",
      "*.supabase.co",
      "*.supabase.com",
      "wss://*.supabase.co",
      "wss://*.supabase.com",
      "*.cloudflare.com"
    ],
    'frame-src': [
      "'self'",
      "www.google.com",
      "www.youtube.com",
      "player.vimeo.com",
      "www.googletagmanager.com"
    ],
    'worker-src': ["'self'", "blob:"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"], // Prevents clickjacking
    'upgrade-insecure-requests': [], // Forces HTTPS
    'block-all-mixed-content': [] // Blocks HTTP content on HTTPS
  },

  // Enhanced Security Headers
  headers: {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': '', // Will be generated dynamically

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection (deprecated but still useful for older browsers)
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy - Enhanced for privacy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Enhanced Permissions Policy with more restrictions
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

    // HSTS (HTTP Strict Transport Security) - Enhanced
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

    // Cross-Origin Policies for enhanced security
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',

    // Security Headers for mobile and legacy browsers
    'X-Download-Options': 'noopen', // IE8+ prevent downloads opening automatically
    'X-Permitted-Cross-Domain-Policies': 'none', // Prevent Flash/PDF exploits
    'X-DNS-Prefetch-Control': 'off', // Disable DNS prefetching for privacy
    
    // Cache Control for sensitive pages
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    
    // Additional security headers
    'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex',
    'Server': '', // Hide server information
    'X-Powered-By': '', // Hide technology stack
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }
}

// Generate CSP string from configuration
export function generateCSP(directives: typeof SECURITY_CONFIG.csp): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')
}

// Enhanced CSP with nonce support for scripts and styles
export function generateCSPWithNonce(nonce?: string): string {
  const csp = { ...SECURITY_CONFIG.csp }

  // Add nonce to script-src and style-src if provided
  if (nonce) {
    csp['script-src'] = [...csp['script-src'], `'nonce-${nonce}'`]
    csp['style-src'] = [...csp['style-src'], `'nonce-${nonce}'`]
  }

  return generateCSP(csp)
}

// Generate security headers for Next.js
export function generateSecurityHeaders(nonce?: string): Record<string, string> {
  const cspString = generateCSPWithNonce(nonce)

  return {
    ...SECURITY_CONFIG.headers,
    'Content-Security-Policy': cspString
  }
}

// Middleware for security headers
export function securityMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next()

  // Generate nonce for CSP
  const nonce = generateNonce()

  // Set security headers
  const securityHeaders = generateSecurityHeaders(nonce)

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Set CSP nonce in request for use in components
  response.headers.set('x-nonce', nonce)

  return response
}

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

// Input sanitization utilities
export const sanitize = {
  // Sanitize HTML input
  html: (input: string): string => {
    const div = document.createElement('div')
    div.textContent = input
    return div.innerHTML
  },

  // Sanitize SQL-like input (basic protection)
  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '')
  },

  // Sanitize URL input
  url: (input: string): string => {
    try {
      const url = new URL(input)
      return url.toString()
    } catch {
      return ''
    }
  },

  // Sanitize email input
  email: (input: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(input) ? input.toLowerCase() : ''
  },

  // Sanitize casino name
  casinoName: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9\s\-_.]/g, '').substring(0, 100)
  }
}

// Rate limiting implementation
export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()

  constructor(
    private windowMs: number = SECURITY_CONFIG.rateLimit.windowMs,
    private maxRequests: number = SECURITY_CONFIG.rateLimit.max
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const requestData = this.requests.get(identifier)

    if (!requestData || now > requestData.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (requestData.count < this.maxRequests) {
      // Within limit
      requestData.count++
      return true
    }

    // Rate limit exceeded
    return false
  }

  getRemainingRequests(identifier: string): number {
    const requestData = this.requests.get(identifier)
    if (!requestData) return this.maxRequests

    return Math.max(0, this.maxRequests - requestData.count)
  }

  getResetTime(identifier: string): number {
    const requestData = this.requests.get(identifier)
    return requestData?.resetTime || Date.now()
  }

  // Cleanup old entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Cleanup old entries periodically
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup()
  }, 60000) // Cleanup every minute
}

// CSRF Protection
export class CSRFProtection {
  private tokens = new Map<string, { token: string; expires: number }>()

  generateToken(sessionId: string): string {
    const token = generateNonce()
    const expires = Date.now() + (60 * 60 * 1000) // 1 hour

    this.tokens.set(sessionId, { token, expires })
    return token
  }

  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)

    if (!stored || stored.token !== token || Date.now() > stored.expires) {
      return false
    }

    // Token is single-use, remove after validation
    this.tokens.delete(sessionId)
    return true
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(key)
      }
    }
  }
}

// Global CSRF protection instance
export const csrfProtection = new CSRFProtection()

// Cleanup expired tokens periodically
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    csrfProtection.cleanup()
  }, 300000) // Cleanup every 5 minutes
}

// Security utilities for components
export const securityUtils = {
  // Generate secure random string
  generateSecureId: (): string => {
    return generateNonce()
  },

  // Validate input with multiple layers
  validateInput: (input: string, type: 'text' | 'email' | 'url' | 'casino'): boolean => {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
      case 'url':
        try {
          new URL(input)
          return true
        } catch {
          return false
        }
      case 'casino':
        return /^[a-zA-Z0-9\s\-_.]{1,100}$/.test(input)
      default:
        return input.length > 0 && input.length <= 1000
    }
  },

  // Escape HTML for safe display
  escapeHtml: (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  },

  // Hash sensitive data for logging
  hashForLog: (data: string): string => {
    // Simple hash for logging purposes (not for security)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }
}

// Enhanced security headers for different contexts
export function getEnhancedSecurityHeaders(context: 'api' | 'admin' | 'public' | 'static' = 'public'): Record<string, string> {
  const baseHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-DNS-Prefetch-Control': 'off',
    'Server': '',
    'X-Powered-By': ''
  }

  switch (context) {
    case 'api':
      return {
        ...baseHeaders,
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Cross-Origin-Opener-Policy': 'same-origin'
      }
    
    case 'admin':
      return {
        ...baseHeaders,
        'Content-Security-Policy': generateCSPWithNonce(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive, notranslate, noimageindex',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin'
      }
    
    case 'static':
      return {
        ...baseHeaders,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      }
    
    default: // public
      return {
        ...baseHeaders,
        'Content-Security-Policy': generateCSPWithNonce(),
        'Cache-Control': 'public, max-age=3600, must-revalidate'
      }
  }
}

// Legacy function for backward compatibility
export function getApiSecurityHeaders(): Record<string, string> {
  return getEnhancedSecurityHeaders('api')
}

// Security middleware for API routes
export function apiSecurityMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next()

  // Add security headers
  const securityHeaders = getApiSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown'

  if (!rateLimiter.isAllowed(clientIP)) {
    return NextResponse.json(
      { error: SECURITY_CONFIG.rateLimit.message },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(SECURITY_CONFIG.rateLimit.windowMs / 1000).toString(),
          'X-RateLimit-Remaining': rateLimiter.getRemainingRequests(clientIP).toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimiter.getResetTime(clientIP) / 1000).toString()
        }
      }
    )
  }

  return response
}
