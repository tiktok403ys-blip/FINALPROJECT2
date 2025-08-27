import { NextRequest, NextResponse } from 'next/server'
import { generateSecurityHeaders, generateCSP, SECURITY_CONFIG } from '../security'

// Type for CSP directives
type CSPDirectives = typeof SECURITY_CONFIG.csp

/**
 * Enhanced CSP middleware with better error handling and logging
 */
export function enhancedCSPMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next()
  
  try {
    // Generate cryptographically secure nonce
    const nonce = generateCSPNonce()
    
    // Use development CSP in dev mode, production CSP in production
    let securityHeaders: Record<string, string>
    
    if (process.env.NODE_ENV === 'development') {
      const devCSP = getDevelopmentCSP()
      securityHeaders = {
        'Content-Security-Policy': generateCSP(devCSP),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    } else {
      // Get production security headers with nonce
      securityHeaders = generateSecurityHeaders(nonce)
    }
    
    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Set nonce for client-side access
    response.headers.set('x-nonce', nonce)
    
    // Add CSP report endpoint if in production
    if (process.env.NODE_ENV === 'production') {
      const csp = response.headers.get('Content-Security-Policy')
      if (csp) {
        const cspWithReporting = `${csp}; report-uri /api/csp-report; report-to csp-endpoint`
        response.headers.set('Content-Security-Policy', cspWithReporting)
      }
    }
    
  } catch (error) {
    console.error('CSP middleware error:', error)
    // Fallback to basic security headers if CSP generation fails
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
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
 * Development mode CSP configuration (more permissive)
 */
export function getDevelopmentCSP(): CSPDirectives {
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js dev mode
      "'unsafe-inline'", // Required for Next.js dev mode
      "*.googletagmanager.com",
      "*.google-analytics.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js dev mode
      "localhost:*", // Allow localhost for Next.js dev server
      "fonts.googleapis.com"
    ],
    'font-src': ["'self'", "fonts.gstatic.com", "data:"],
    'img-src': ["'self'", "data:", "blob:", "https:"],
    'connect-src': ["'self'", "*.supabase.co", "wss://*.supabase.co"],
    'frame-src': ["'self'"],
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