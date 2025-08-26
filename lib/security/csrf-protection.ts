import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

// CSRF configuration
interface CSRFConfig {
  tokenLength: number
  cookieName: string
  headerName: string
  cookieOptions: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    maxAge: number
    path: string
  }
  excludeMethods: string[]
}

// Default CSRF configuration
const DEFAULT_CONFIG: CSRFConfig = {
  tokenLength: 32,
  cookieName: '__csrf_token',
  headerName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  },
  excludeMethods: ['GET', 'HEAD', 'OPTIONS']
}

// Generate cryptographically secure random token (Edge-compatible)
function generateCSRFToken(length: number = 32): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Validate CSRF token timing-safe comparison (Edge-compatible)
function validateCSRFToken(token1: string, token2: string): boolean {
  if (!token1 || !token2 || token1.length !== token2.length) {
    return false
  }
  
  // Use Web Crypto API for timing-safe comparison
  try {
    const encoder = new TextEncoder()
    const data1 = encoder.encode(token1)
    const data2 = encoder.encode(token2)
    
    // Simple timing-safe comparison for Edge Runtime
    let result = 0
    for (let i = 0; i < data1.length; i++) {
      result |= data1[i] ^ data2[i]
    }
    
    return result === 0
  } catch {
    return false
  }
}

// Extract CSRF token from various sources
function extractCSRFToken(req: NextRequest, config: CSRFConfig): string | null {
  // Try header first
  const headerToken = req.headers.get(config.headerName)
  if (headerToken) {
    return headerToken
  }
  
  // Try form data for POST requests
  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Note: In a real implementation, you'd need to parse the body
      // This is a simplified version
      return null
    }
  }
  
  return null
}

// Log CSRF violations
function logCSRFViolation(req: NextRequest, reason: string) {
  const timestamp = new Date().toISOString()
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const referer = req.headers.get('referer') || 'none'
  
  logger.warn(`[CSRF_VIOLATION] ${timestamp} - IP: ${ip}, Reason: ${reason}, UA: ${userAgent}, Referer: ${referer}`)
  
  // In production, send to security monitoring service
}

// Create CSRF protection middleware
export function createCSRFProtection(config: Partial<CSRFConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return async function csrfMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const method = req.method.toUpperCase()
    
    // Skip CSRF protection for safe methods
    if (finalConfig.excludeMethods.includes(method)) {
      return null
    }
    
    // Get CSRF token from cookie (edge-compatible)
    const cookieToken = req.cookies.get(finalConfig.cookieName)?.value
    
    if (!cookieToken) {
      logCSRFViolation(req, 'Missing CSRF cookie')
      return NextResponse.json(
        {
          error: 'CSRF Protection',
          message: 'CSRF token missing. Please refresh the page and try again.',
          code: 'CSRF_TOKEN_MISSING'
        },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      )
    }
    
    // Extract token from request
    const requestToken = extractCSRFToken(req, finalConfig)
    
    if (!requestToken) {
      logCSRFViolation(req, 'Missing CSRF token in request')
      return NextResponse.json(
        {
          error: 'CSRF Protection',
          message: 'CSRF token required in header or form data.',
          code: 'CSRF_TOKEN_REQUIRED'
        },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      )
    }
    
    // Validate tokens
    if (!validateCSRFToken(cookieToken, requestToken)) {
      logCSRFViolation(req, 'Invalid CSRF token')
      return NextResponse.json(
        {
          error: 'CSRF Protection',
          message: 'Invalid CSRF token. Please refresh the page and try again.',
          code: 'CSRF_TOKEN_INVALID'
        },
        {
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          }
        }
      )
    }
    
    // CSRF validation passed
    return null
  }
}

// Generate and set CSRF token
export function generateAndSetCSRFToken(config: Partial<CSRFConfig> = {}): { token: string; cookie: string } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const token = generateCSRFToken(finalConfig.tokenLength)
  
  // Create cookie string
  const cookieOptions = finalConfig.cookieOptions
  const cookieParts = [
    `${finalConfig.cookieName}=${token}`,
    `Path=${cookieOptions.path}`,
    `Max-Age=${cookieOptions.maxAge}`,
    `SameSite=${cookieOptions.sameSite}`
  ]
  
  if (cookieOptions.httpOnly) {
    cookieParts.push('HttpOnly')
  }
  
  if (cookieOptions.secure) {
    cookieParts.push('Secure')
  }
  
  const cookie = cookieParts.join('; ')
  
  return { token, cookie }
}

// Get current CSRF token from cookies (edge-compatible)
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  try {
    return request.cookies.get(DEFAULT_CONFIG.cookieName)?.value || null
  } catch {
    return null
  }
}

// Validate CSRF token from request (edge-compatible)
export function validateCSRFTokenFromRequest(req: NextRequest, token: string): boolean {
  try {
    const cookieToken = req.cookies.get(DEFAULT_CONFIG.cookieName)?.value
    
    if (!cookieToken || !token) {
      return false
    }
    
    return validateCSRFToken(cookieToken, token)
  } catch {
    return false
  }
}

// Pre-configured CSRF protection for admin endpoints
export const adminCSRFProtection = createCSRFProtection({
  cookieName: '__admin_csrf_token',
  headerName: 'x-admin-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours for admin sessions
    path: '/admin'
  }
})

// Helper function to apply CSRF protection to API routes
export function withCSRFProtection(csrfProtection: ReturnType<typeof createCSRFProtection>) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      // Apply CSRF protection
      const csrfResponse = await csrfProtection(req)
      
      if (csrfResponse) {
        return csrfResponse
      }
      
      // Execute the original handler
      return await handler(req)
    }
  }
}

// API endpoint to get CSRF token
export async function getCSRFTokenEndpoint(): Promise<NextResponse> {
  const { token, cookie } = generateAndSetCSRFToken()
  
  const response = NextResponse.json({
    csrfToken: token,
    message: 'CSRF token generated successfully'
  })
  
  response.headers.set('Set-Cookie', cookie)
  
  return response
}

// Admin-specific CSRF token endpoint
export async function getAdminCSRFTokenEndpoint(): Promise<NextResponse> {
  const { token, cookie } = generateAndSetCSRFToken({
    cookieName: '__admin_csrf_token',
    headerName: 'x-admin-csrf-token',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/admin'
    }
  })
  
  const response = NextResponse.json({
    csrfToken: token,
    message: 'Admin CSRF token generated successfully'
  })
  
  response.headers.set('Set-Cookie', cookie)
  
  return response
}

// Middleware to automatically refresh CSRF tokens
export function autoRefreshCSRFToken(config: Partial<CSRFConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  return function (response: NextResponse): NextResponse {
    // Generate new token for each response
    const { token, cookie } = generateAndSetCSRFToken(finalConfig)
    
    // Add token to response headers for client-side access
    response.headers.set('X-CSRF-Token', token)
    response.headers.set('Set-Cookie', cookie)
    
    return response
  }
}

// Legacy function aliases for backward compatibility
export const createCSRFToken = generateAndSetCSRFToken
export const requiresCSRFProtection = (method: string) => !DEFAULT_CONFIG.excludeMethods.includes(method.toUpperCase())
export { validateCSRFTokenFromRequest as validateCSRFToken }
export const createCSRFErrorResponse = (reason: string) => {
  return NextResponse.json(
    {
      error: 'CSRF Protection',
      message: 'CSRF validation failed. Please refresh the page and try again.',
      code: 'CSRF_VALIDATION_FAILED',
      reason
    },
    {
      status: 403,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  )
}