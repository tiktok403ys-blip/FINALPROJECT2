import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple In-Memory Rate Limiter
 * Lightweight and compatible with Next.js (both server and client)
 */

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  statusCode?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  response?: NextResponse
}

export class SimpleRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()

  constructor(
    private config: RateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests per window
      message: 'Too many requests, please try again later.',
      statusCode: 429
    }
  ) {}

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): RateLimitResult {
    const now = Date.now()
    const requestData = this.requests.get(identifier)

    if (!requestData || now > requestData.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }

    if (requestData.count < this.config.maxRequests) {
      // Within limit
      requestData.count++
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - requestData.count,
        resetTime: requestData.resetTime
      }
    }

    // Rate limit exceeded
    const response = NextResponse.json(
      { 
        error: this.config.message,
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      },
      { 
        status: this.config.statusCode,
        headers: {
          'Retry-After': Math.ceil((requestData.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(requestData.resetTime / 1000).toString()
        }
      }
    )

    return {
      allowed: false,
      remaining: 0,
      resetTime: requestData.resetTime,
      response
    }
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemainingRequests(identifier: string): number {
    const requestData = this.requests.get(identifier)
    if (!requestData) return this.config.maxRequests

    const now = Date.now()
    if (now > requestData.resetTime) return this.config.maxRequests

    return Math.max(0, this.config.maxRequests - requestData.count)
  }

  /**
   * Get reset time for an identifier
   */
  getResetTime(identifier: string): number {
    const requestData = this.requests.get(identifier)
    return requestData?.resetTime || Date.now()
  }

  /**
   * Cleanup old entries (called manually or on each request)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key)
      }
    }
  }

  /**
   * Reset rate limiter for an identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  /**
   * Get current rate limit stats
   */
  getStats(): { totalIdentifiers: number; totalRequests: number } {
    let totalRequests = 0
    for (const data of this.requests.values()) {
      totalRequests += data.count
    }

    return {
      totalIdentifiers: this.requests.size,
      totalRequests
    }
  }

  /**
   * Cleanup old entries and get stats
   */
  getStatsWithCleanup(): { totalIdentifiers: number; totalRequests: number; cleanedEntries: number } {
    const beforeCleanup = this.requests.size
    this.cleanup()
    const afterCleanup = this.requests.size
    const cleanedEntries = beforeCleanup - afterCleanup

    return {
      ...this.getStats(),
      cleanedEntries
    }
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // General API rate limiting
  api: new SimpleRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'API rate limit exceeded. Please try again later.'
  }),

  // Admin panel rate limiting (more strict)
  admin: new SimpleRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    message: 'Admin rate limit exceeded. Please try again later.'
  }),

  // Authentication rate limiting (very strict)
  auth: new SimpleRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Public page rate limiting (more lenient)
  public: new SimpleRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,
    message: 'Too many requests. Please try again later.'
  })
}

/**
 * Rate limiting middleware for Next.js
 */
export function rateLimitMiddleware(
  request: NextRequest,
  limiter: SimpleRateLimiter = rateLimiters.api
): RateLimitResult {
  const identifier = getClientIdentifier(request)
  
  // Cleanup old entries on each request (lightweight operation)
  limiter.cleanup()
  
  return limiter.isAllowed(identifier)
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP address
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown'
  
  // Use IP as identifier
  return ip.toString()
}

/**
 * Apply rate limiting to response headers
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
  
  return response
}

// Export default instance
export default SimpleRateLimiter
