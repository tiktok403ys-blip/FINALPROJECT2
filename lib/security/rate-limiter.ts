import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
}

// Rate limit entry structure
interface RateLimitEntry {
  requests: number[]
  violations: number
  lastViolation?: number
  blocked?: boolean
  blockUntil?: number
}

// In-memory store for rate limiting
class MemoryStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    
    for (const [key, entry] of this.store.entries()) {
      // Remove entries older than 1 hour
      entry.requests = entry.requests.filter(timestamp => now - timestamp < oneHour)
      
      // Remove empty entries
      if (entry.requests.length === 0 && (!entry.blockUntil || entry.blockUntil < now)) {
        this.store.delete(key)
      }
    }
  }

  get(key: string): RateLimitEntry {
    return this.store.get(key) || {
      requests: [],
      violations: 0
    }
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Global memory store instance
const memoryStore = new MemoryStore()

// Default configuration for admin endpoints
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // 100 requests per hour
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req: NextRequest) => {
    // Use IP address as key, with fallback to user agent
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `rate_limit:${ip}`
  }
}

// Calculate exponential backoff duration
function calculateBackoffDuration(violations: number): number {
  // Exponential backoff: 2^violations minutes, max 24 hours
  const minutes = Math.min(Math.pow(2, violations), 24 * 60)
  return minutes * 60 * 1000 // Convert to milliseconds
}

// Log abuse attempts
function logAbuseAttempt(key: string, violations: number, ip: string) {
  const timestamp = new Date().toISOString()
  console.warn(`[RATE_LIMIT_VIOLATION] ${timestamp} - IP: ${ip}, Key: ${key}, Violations: ${violations}`)
  
  // In production, you might want to send this to a monitoring service
  // or write to a dedicated security log file
}

// Main rate limiting function
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const key = finalConfig.keyGenerator!(req)
    const now = Date.now()
    const windowStart = now - finalConfig.windowMs
    
    // Get current entry
    const entry = memoryStore.get(key)
    
    // Check if currently blocked
    if (entry.blocked && entry.blockUntil && entry.blockUntil > now) {
      const remainingTime = Math.ceil((entry.blockUntil - now) / 1000 / 60) // minutes
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${remainingTime} minutes.`,
          retryAfter: remainingTime * 60 // seconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(remainingTime * 60),
            'X-RateLimit-Limit': String(finalConfig.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.blockUntil / 1000))
          }
        }
      )
    }
    
    // Filter requests within current window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (entry.requests.length >= finalConfig.maxRequests) {
      entry.violations += 1
      entry.lastViolation = now
      
      // Calculate block duration with exponential backoff
      const blockDuration = calculateBackoffDuration(entry.violations)
      entry.blocked = true
      entry.blockUntil = now + blockDuration
      
      // Log the abuse attempt
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
      logAbuseAttempt(key, entry.violations, ip)
      
      // Save updated entry
      memoryStore.set(key, entry)
      
      const remainingTime = Math.ceil(blockDuration / 1000 / 60) // minutes
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Blocked for ${remainingTime} minutes due to repeated violations.`,
          retryAfter: remainingTime * 60,
          violations: entry.violations
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(remainingTime * 60),
            'X-RateLimit-Limit': String(finalConfig.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.blockUntil / 1000))
          }
        }
      )
    }
    
    // Add current request
    entry.requests.push(now)
    
    // Reset block status if not violated recently
    if (entry.blocked && (!entry.lastViolation || now - entry.lastViolation > finalConfig.windowMs)) {
      entry.blocked = false
      entry.blockUntil = undefined
    }
    
    // Save updated entry
    memoryStore.set(key, entry)
    
    // Calculate remaining requests
    const remaining = Math.max(0, finalConfig.maxRequests - entry.requests.length)
    const resetTime = Math.ceil((windowStart + finalConfig.windowMs) / 1000)
    
    // Add rate limit headers to response (will be added by the calling code)
    const headers = {
      'X-RateLimit-Limit': String(finalConfig.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTime)
    }
    
    // Store headers in request for later use
    ;(req as any).rateLimitHeaders = headers
    
    // Allow request to proceed
    return null
  }
}

// Pre-configured rate limiter for admin endpoints
export const adminRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // 100 requests per hour for admin operations
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return `admin_rate_limit:${ip}`
  }
})

// Stricter rate limiter for sensitive operations
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per 15 minutes
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return `strict_rate_limit:${ip}`
  }
})

// Helper function to apply rate limiting to API routes
export function withRateLimit(rateLimiter: ReturnType<typeof createRateLimiter>) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      // Apply rate limiting
      const rateLimitResponse = await rateLimiter(req)
      
      if (rateLimitResponse) {
        return rateLimitResponse
      }
      
      // Execute the original handler
      const response = await handler(req)
      
      // Add rate limit headers to successful responses
      const rateLimitHeaders = (req as any).rateLimitHeaders
      if (rateLimitHeaders) {
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value as string)
        })
      }
      
      return response
    }
  }
}

// Rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  PIN_VERIFICATION: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    // QA-friendly: lebih longgar; kembalikan ke nilai konservatif di production bila perlu
    maxRequests: 15, // 15 attempts per 15 minutes
    blockDuration: 5 * 60 * 1000 // 5 minutes block
  },
  ADMIN_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
    blockDuration: 15 * 60 * 1000 // 15 minutes block
  },
  ADMIN_MUTATIONS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 mutations per hour
    blockDuration: 10 * 60 * 1000 // 10 minutes block
  },
  ADMIN_API: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 requests per hour
    blockDuration: 5 * 60 * 1000 // 5 minutes block
  }
}

// Get client identifier from request
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

// Legacy rate limit function for backward compatibility
export function rateLimit(req: NextRequest, clientId: string, config: any) {
  const now = Date.now()
  const key = `legacy_rate_limit:${clientId}`
  const entry = memoryStore.get(key)
  
  // Filter requests within current window
  entry.requests = entry.requests.filter(timestamp => timestamp > now - config.windowMs)
  
  // Check if limit exceeded
  const isExceeded = entry.requests.length >= config.maxRequests
  
  if (!isExceeded) {
    entry.requests.push(now)
    memoryStore.set(key, entry)
  }
  
  return {
    success: !isExceeded,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.requests.length),
    resetTime: now + config.windowMs,
    retryAfter: isExceeded ? Math.ceil(config.blockDuration / 1000) : undefined
  }
}

// Cleanup function for graceful shutdown
export function cleanup() {
  memoryStore.destroy()
}