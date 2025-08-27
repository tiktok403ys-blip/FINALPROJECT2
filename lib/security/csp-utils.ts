import { NextRequest, NextResponse } from 'next/server'
import { generateSecurityHeaders, generateCSP, SECURITY_CONFIG } from '../security'

// Type for CSP directives
type CSPDirectives = typeof SECURITY_CONFIG.csp

/**
 * Enhanced CSP middleware with better error handling and logging
 */
export function enhancedCSPMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next()
  const nonce = generateCSPNonce()
  
  // Store nonce in response headers for use in components
  response.headers.set('X-Nonce', nonce)
  
  // Skip CSP in development to avoid Next.js conflicts
  if (process.env.NODE_ENV === 'development') {
    // Only apply minimal security headers in development
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }
  
  try {
    const cspDirectives = getProductionCSP()
    
    // Add nonce to script-src and style-src
    if (cspDirectives['script-src']) {
      cspDirectives['script-src'].push(`'nonce-${nonce}'`)
    }
    if (cspDirectives['style-src']) {
      cspDirectives['style-src'].push(`'nonce-${nonce}'`)
    }
    
    // Build CSP header string
    const cspHeader = Object.entries(cspDirectives)
      .filter(([_, values]) => values.length > 0)
      .map(([directive, values]) => `${directive} ${values.join(' ')}`)
      .join('; ')
    
    response.headers.set('Content-Security-Policy', cspHeader)
    
  } catch (error) {
    console.error('Failed to generate CSP:', error)
  }
  
  return response
}

/**
 * Generate cryptographically secure nonce for CSP
 */
export function generateCSPNonce(): string {
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
 * Validate CSP nonce format
 */
export function isValidNonce(nonce: string): boolean {
  // Nonce should be 32 hex characters
  return /^[a-f0-9]{32}$/i.test(nonce)
}

/**
 * Get nonce from request headers
 */
export function getNonceFromRequest(request: NextRequest): string | null {
  const nonce = request.headers.get('x-nonce')
  return nonce && isValidNonce(nonce) ? nonce : null
}

/**
 * CSP violation reporting types
 */
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string
    'referrer': string
    'violated-directive': string
    'effective-directive': string
    'original-policy': string
    'disposition': string
    'blocked-uri': string
    'line-number': number
    'column-number': number
    'source-file': string
    'status-code': number
    'script-sample': string
  }
}

/**
 * Process CSP violation reports
 */
export function processCSPViolation(report: CSPViolationReport): void {
  const violation = report['csp-report']
  
  // Log violation (in production, send to monitoring service)
  console.warn('CSP Violation:', {
    directive: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    documentUri: violation['document-uri'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number']
  })
  
  // In production, you might want to:
  // - Send to error tracking service (Sentry, etc.)
  // - Store in database for analysis
  // - Alert security team for suspicious patterns
}

/**
 * Production mode CSP configuration (strict security)
 */
export function getProductionCSP(): CSPDirectives {
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'strict-dynamic'",
      "*.gurusingapore.com",
      "*.googletagmanager.com",
      "*.google-analytics.com",
      "www.googletagmanager.com",
      "www.google-analytics.com",
      "googletagmanager.com",
      "analytics.google.com",
      "tagmanager.google.com",
      "*.doubleclick.net"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js CSS-in-JS
      "fonts.googleapis.com",
      "fonts.gstatic.com",
      "*.gurusingapore.com"
    ],
    'font-src': ["'self'", "fonts.googleapis.com", "fonts.gstatic.com", "data:"],
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
      "*.amazonaws.com",
      "*.gurusingapore.com"
    ],
    'connect-src': [
      "'self'", 
      "*.google-analytics.com",
      "*.googletagmanager.com",
      "analytics.google.com",
      "stats.g.doubleclick.net",
      "*.doubleclick.net",
      "region1.google-analytics.com",
      "*.supabase.co",
      "*.supabase.com",
      "https://gzslsakmkoxfhcyifgtb.supabase.co",
      "wss://gzslsakmkoxfhcyifgtb.supabase.co",
      "wss://*.supabase.co",
      "wss://*.supabase.com",
      "*.cloudflare.com",
      "*.gurusingapore.com"
    ],
    'frame-src': ["'self'", "www.google.com", "www.youtube.com", "player.vimeo.com", "www.googletagmanager.com"],
    'worker-src': ["'self'", "blob:"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': []
  } as CSPDirectives
}

/**
 * Development mode CSP configuration (more permissive for Next.js)
 */
export function getDevelopmentCSP(): CSPDirectives {
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js webpack and HMR
      "'unsafe-inline'", // Required for Next.js inline scripts
      "localhost:*", // Allow localhost for Next.js dev server
      "127.0.0.1:*", // Allow local IP for dev server
      "*.googletagmanager.com",
      "*.google-analytics.com",
      "www.googletagmanager.com",
      "www.google-analytics.com",
      "googletagmanager.com",
      "analytics.google.com",
      "*.analytics.google.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js CSS-in-JS and dev mode
      "localhost:*", // Allow localhost for Next.js dev server
      "127.0.0.1:*", // Allow local IP for dev server
      "fonts.googleapis.com",
      "fonts.gstatic.com"
    ],
    'font-src': ["'self'", "fonts.googleapis.com", "fonts.gstatic.com", "data:"],
    'img-src': [
      "'self'", 
      "data:", 
      "blob:", 
      "https:",
      "*.googletagmanager.com",
      "*.google-analytics.com",
      "*.supabase.co",
      "*.supabase.com"
    ],
    'connect-src': [
      "'self'", 
      "localhost:*", // Allow localhost for Next.js dev server
      "127.0.0.1:*", // Allow local IP for dev server
      "ws://localhost:*", // WebSocket for HMR
      "wss://localhost:*", // Secure WebSocket for HMR
      "*.supabase.co", 
      "wss://*.supabase.co",
      "*.google-analytics.com",
      "*.googletagmanager.com",
      "analytics.google.com",
      "stats.g.doubleclick.net"
    ],
    'frame-src': ["'self'", "www.google.com", "www.googletagmanager.com"],
    'worker-src': ["'self'", "blob:"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': []
  } as CSPDirectives
}