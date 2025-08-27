import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple CSRF Protection for Next.js
 * Lightweight and compatible with Next.js (both server and client)
 */

export interface CSRFToken {
  token: string
  expires: number
}

export interface CSRFConfig {
  secret: string
  tokenLength?: number
  expiresIn?: number // milliseconds
  cookieName?: string
  headerName?: string
}

export class SimpleCSRFProtection {
  private tokens = new Map<string, CSRFToken>()

  constructor(
    private config: CSRFConfig = {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      tokenLength: 32,
      expiresIn: 60 * 60 * 1000, // 1 hour
      cookieName: 'csrf-token',
      headerName: 'x-csrf-token'
    }
  ) {}

  /**
   * Generate a new CSRF token
   */
  generateToken(sessionId: string): string {
    const token = this.generateRandomString(this.config.tokenLength!)
    const expires = Date.now() + this.config.expiresIn!

    this.tokens.set(sessionId, { token, expires })
    return token
  }

  /**
   * Validate a CSRF token
   */
  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)

    if (!stored || stored.token !== token || Date.now() > stored.expires) {
      return false
    }

    // Token is single-use, remove after validation
    this.tokens.delete(sessionId)
    return true
  }

  /**
   * Create CSRF token cookie
   */
  createTokenCookie(sessionId: string): string {
    const token = this.generateToken(sessionId)
    const expires = new Date(Date.now() + this.config.expiresIn!)
    
    return `${this.config.cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}; Path=/`
  }

  /**
   * Get CSRF token from request
   */
  getTokenFromRequest(request: NextRequest): string | null {
    // Try header first
    if (this.config.headerName) {
      const headerToken = request.headers.get(this.config.headerName)
      if (headerToken) return headerToken
    }

    // Try cookie
    if (this.config.cookieName) {
      const cookieToken = request.cookies.get(this.config.cookieName)?.value
      if (cookieToken) return cookieToken
    }

    // Try form data - simplified for Next.js compatibility
    // Note: Form data validation is complex in Next.js, so we'll skip it for now

    return null
  }

  /**
   * Validate CSRF token from request
   */
  validateRequest(request: NextRequest, sessionId: string): boolean {
    const token = this.getTokenFromRequest(request)
    if (!token) return false

    return this.validateToken(sessionId, token)
  }

  /**
   * Generate random string for token
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length]
      }
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
    }
    
    return result
  }

  /**
   * Cleanup expired tokens (called manually or on each request)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(key)
      }
    }
  }

  /**
   * Get current token stats with cleanup
   */
  getStatsWithCleanup(): { totalTokens: number; activeTokens: number; cleanedTokens: number } {
    const beforeCleanup = this.tokens.size
    this.cleanup()
    const afterCleanup = this.tokens.size
    const cleanedTokens = beforeCleanup - afterCleanup

    const now = Date.now()
    let activeTokens = 0

    for (const data of this.tokens.values()) {
      if (now <= data.expires) {
        activeTokens++
      }
    }

    return {
      totalTokens: this.tokens.size,
      activeTokens,
      cleanedTokens
    }
  }

  /**
   * Get current token stats
   */
  getStats(): { totalTokens: number; activeTokens: number } {
    const now = Date.now()
    let activeTokens = 0

    for (const data of this.tokens.values()) {
      if (now <= data.expires) {
        activeTokens++
      }
    }

    return {
      totalTokens: this.tokens.size,
      activeTokens
    }
  }

  /**
   * Reset all tokens
   */
  reset(): void {
    this.tokens.clear()
  }
}

/**
 * CSRF Middleware for Next.js
 */
export function csrfMiddleware(
  request: NextRequest,
  response: NextResponse,
  sessionId: string
): NextResponse {
  const csrf = new SimpleCSRFProtection()
  
  // Cleanup expired tokens on each request
  csrf.cleanup()
  
  // For GET requests, generate and set token
  if (request.method === 'GET') {
    const cookie = csrf.createTokenCookie(sessionId)
    response.headers.set('Set-Cookie', cookie)
  }
  
  // For POST/PUT/DELETE requests, validate token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (!csrf.validateRequest(request, sessionId)) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      )
    }
  }

  return response
}

/**
 * CSRF Token Generator for Forms
 */
export function generateCSRFToken(sessionId: string): string {
  const csrf = new SimpleCSRFProtection()
  return csrf.generateToken(sessionId)
}

/**
 * CSRF Token Validator
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const csrf = new SimpleCSRFProtection()
  return csrf.validateToken(sessionId, token)
}

// Export default instance
export default SimpleCSRFProtection
