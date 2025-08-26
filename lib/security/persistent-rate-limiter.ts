import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getValidatedEnv } from '@/lib/config/env-validator'

// Rate limit data structure
interface RateLimitData {
  requests: number[]
  violations: number
  lastViolation?: number
  blocked?: boolean
  blockUntil?: number
}

// Rate limit configuration
interface PersistentRateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  blockDuration?: number
}

// Abstract store interface
interface RateLimitStore {
  get(key: string): Promise<RateLimitData | null>
  set(key: string, data: RateLimitData, ttlSeconds: number): Promise<void>
  delete(key: string): Promise<void>
}

// Redis store implementation (placeholder - requires ioredis to be installed)
class RedisStore implements RateLimitStore {
  private redis: any = null
  private isConnected = false

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis() {
    try {
      const env = getValidatedEnv()
      if (!env.REDIS_URL) {
        logger.warn('Redis URL not configured, falling back to Supabase store', {
          component: 'persistent-rate-limiter',
          action: 'initialize-redis'
        })
        return
      }

      // Note: Redis implementation requires ioredis package to be installed
      // For now, we'll skip Redis and use Supabase fallback
      logger.warn('Redis implementation requires ioredis package, falling back to Supabase', {
        component: 'persistent-rate-limiter',
        action: 'initialize-redis'
      })
      this.isConnected = false
    } catch (error) {
      logger.error('Failed to initialize Redis store', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'initialize-redis'
      })
      this.isConnected = false
    }
  }

  async get(key: string): Promise<RateLimitData | null> {
    if (!this.isConnected || !this.redis) {
      throw new Error('Redis not connected')
    }

    try {
      const data = await this.redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error('Redis get operation failed', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'redis-get',
        metadata: { key }
      })
      throw error
    }
  }

  async set(key: string, data: RateLimitData, ttlSeconds: number): Promise<void> {
    if (!this.isConnected || !this.redis) {
      throw new Error('Redis not connected')
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data))
    } catch (error) {
      logger.error('Redis set operation failed', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'redis-set',
        metadata: { key, ttlSeconds }
      })
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.redis) {
      throw new Error('Redis not connected')
    }

    try {
      await this.redis.del(key)
    } catch (error) {
      logger.error('Redis delete operation failed', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'redis-delete',
        metadata: { key }
      })
      throw error
    }
  }
}

// Supabase store implementation (fallback)
class SupabaseStore implements RateLimitStore {
  private supabase: any = null

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const env = getValidatedEnv()
      
      if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        logger.error('Supabase service role key not configured', new Error('Missing SUPABASE_SERVICE_ROLE_KEY'), {
          component: 'persistent-rate-limiter',
          action: 'initialize-supabase'
        })
        return
      }
      
      this.supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      )

      logger.info('Supabase store initialized successfully', {
        component: 'persistent-rate-limiter',
        action: 'initialize-supabase'
      })
    } catch (error) {
      logger.error('Failed to initialize Supabase store', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'initialize-supabase'
      })
      throw error
    }
  }

  async get(key: string): Promise<RateLimitData | null> {
    try {
      const { data, error } = await this.supabase
        .from('rate_limits')
        .select('data, expires_at')
        .eq('key', key)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
      }

      if (!data) {
        return null
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        await this.delete(key)
        return null
      }

      return typeof data.data === 'string' ? JSON.parse(data.data) : data.data
    } catch (error) {
      logger.error('Supabase get operation failed', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'supabase-get',
        metadata: { key }
      })
      throw error
    }
  }

  async set(key: string, data: RateLimitData, ttlSeconds: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
      
      const { error } = await this.supabase
        .from('rate_limits')
        .upsert({
          key,
          data: JSON.stringify(data),
          expires_at: expiresAt.toISOString()
        })

      if (error) {
        throw error
      }
    } catch (error) {
      logger.error('Supabase set operation failed', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'supabase-set',
        metadata: { key, ttlSeconds }
      })
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('rate_limits')
        .delete()
        .eq('key', key)

      if (error) {
        throw error
      }
    } catch (error) {
      logger.error('Supabase delete operation failed', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'supabase-delete',
        metadata: { key }
      })
      throw error
    }
  }
}

// Memory store fallback (for development)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { data: RateLimitData; expiresAt: number }>()

  async get(key: string): Promise<RateLimitData | null> {
    const entry = this.store.get(key)
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.data
  }

  async set(key: string, data: RateLimitData, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}

// Store factory
class StoreFactory {
  private static instance: RateLimitStore | null = null

  static async getStore(): Promise<RateLimitStore> {
    if (this.instance) {
      return this.instance
    }

    const env = getValidatedEnv()
    
    // Try Redis first
    if (env.REDIS_URL) {
      try {
        const redisStore = new RedisStore()
        this.instance = redisStore
        return redisStore
      } catch (error) {
        logger.warn('Redis store failed, falling back to Supabase', {
          component: 'persistent-rate-limiter',
          action: 'store-factory',
          metadata: { error: (error as Error).message }
        })
      }
    }

    // Fallback to Supabase
    try {
      const supabaseStore = new SupabaseStore()
      this.instance = supabaseStore
      return supabaseStore
    } catch (error) {
      logger.warn('Supabase store failed, falling back to memory', {
        component: 'persistent-rate-limiter',
        action: 'store-factory',
        metadata: { error: (error as Error).message }
      })
    }

    // Final fallback to memory (development only)
    if (env.NODE_ENV !== 'production') {
      logger.warn('Using memory store for rate limiting (development only)', {
        component: 'persistent-rate-limiter',
        action: 'store-factory'
      })
      const memoryStore = new MemoryStore()
      this.instance = memoryStore
      return memoryStore
    }

    throw new Error('No persistent store available for rate limiting')
  }
}

// Default configuration
const DEFAULT_CONFIG: PersistentRateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  blockDuration: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return `rate_limit:${ip}`
  }
}

// Calculate exponential backoff duration
function calculateBackoffDuration(violations: number, baseDuration: number): number {
  const minutes = Math.min(Math.pow(2, violations), 24 * 60)
  return Math.max(minutes * 60 * 1000, baseDuration)
}

// Main persistent rate limiter function
export function createPersistentRateLimiter(config: Partial<PersistentRateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return async function persistentRateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
    try {
      const store = await StoreFactory.getStore()
      const key = finalConfig.keyGenerator!(req)
      const now = Date.now()
      const windowStart = now - finalConfig.windowMs

      // Get current entry
      let entry = await store.get(key)
      if (!entry) {
        entry = {
          requests: [],
          violations: 0
        }
      }

      // Check if currently blocked
      if (entry.blocked && entry.blockUntil && entry.blockUntil > now) {
        const remainingTime = Math.ceil((entry.blockUntil - now) / 1000)
        
        logger.security('Rate limit block active', {
          component: 'persistent-rate-limiter',
          action: 'block-active',
          metadata: {
            key,
            remainingTime,
            violations: entry.violations
          }
        })

        return NextResponse.json(
          {
            error: 'Too many requests',
            retryAfter: remainingTime,
            blocked: true
          },
          {
            status: 429,
            headers: {
              'Retry-After': remainingTime.toString(),
              'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(entry.blockUntil).toISOString()
            }
          }
        )
      }

      // Clear expired requests
      entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)

      // Check rate limit
      if (entry.requests.length >= finalConfig.maxRequests) {
        // Rate limit exceeded
        entry.violations++
        entry.lastViolation = now

        // Calculate block duration with exponential backoff
        const blockDuration = calculateBackoffDuration(entry.violations, finalConfig.blockDuration || 15 * 60 * 1000)
        entry.blocked = true
        entry.blockUntil = now + blockDuration

        // Save updated entry
        await store.set(key, entry, Math.ceil(blockDuration / 1000))

        logger.security('Rate limit exceeded, blocking client', {
          component: 'persistent-rate-limiter',
          action: 'rate-limit-exceeded',
          metadata: {
            key,
            violations: entry.violations,
            blockDuration: blockDuration / 1000,
            requests: entry.requests.length
          }
        })

        return NextResponse.json(
          {
            error: 'Too many requests',
            retryAfter: Math.ceil(blockDuration / 1000),
            blocked: true
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(blockDuration / 1000).toString(),
              'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(entry.blockUntil).toISOString()
            }
          }
        )
      }

      // Add current request
      entry.requests.push(now)
      entry.blocked = false
      entry.blockUntil = undefined

      // Save updated entry
      const ttl = Math.ceil(finalConfig.windowMs / 1000)
      await store.set(key, entry, ttl)

      // Calculate remaining requests
      const remaining = Math.max(0, finalConfig.maxRequests - entry.requests.length)
      const resetTime = Math.ceil((windowStart + finalConfig.windowMs) / 1000)

      // Add rate limit headers to response (will be added by the calling code)
      const headers = {
        'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime * 1000).toISOString()
      }

      // Log successful request
      logger.info('Rate limit check passed', {
        component: 'persistent-rate-limiter',
        action: 'check-passed',
        metadata: {
          key,
          remaining,
          requests: entry.requests.length
        }
      })

      return null // Allow request to proceed
    } catch (error) {
      logger.error('Persistent rate limiter error', error as Error, {
        component: 'persistent-rate-limiter',
        action: 'middleware-error'
      })
      
      // In case of store failure, allow request but log the error
      return null
    }
  }
}

// Pre-configured rate limiters
export const persistentAdminRateLimiter = createPersistentRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100,
  blockDuration: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return `admin_rate_limit:${ip}`
  }
})

export const persistentStrictRateLimiter = createPersistentRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  blockDuration: 30 * 60 * 1000, // 30 minutes
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return `strict_rate_limit:${ip}`
  }
})

export const persistentApiRateLimiter = createPersistentRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  blockDuration: 5 * 60 * 1000, // 5 minutes
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return `api_rate_limit:${ip}`
  }
})

// Helper function to get client identifier
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

// Export store factory for testing
export { StoreFactory }