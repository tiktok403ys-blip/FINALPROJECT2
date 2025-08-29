import { z } from 'zod'
import { logger } from '../logger'

/**
 * Environment validation schema using Zod
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Next.js Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL').default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1, 'Site name is required').default('GuruSingapore'),
  
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required').optional(),
  
  // Database Configuration
  DATABASE_URL: z.string().url('Invalid database URL').optional(),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL').optional(),
  
  // Admin Configuration
  ADMIN_EMAIL: z.string().email('Invalid admin email').optional(),
  ADMIN_PASSWORD_HASH: z.string().min(1, 'Admin password hash is required').optional(),
  
  // Security Configuration
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters').optional(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').optional(),
  
  // Rate Limiting
  REDIS_URL: z.string().url('Invalid Redis URL').optional().or(z.literal('')),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).default('100'),
  
  // Analytics & Monitoring
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional().or(z.literal('')),
  
  // External APIs
  CASINO_API_KEY: z.string().optional(),
  CASINO_API_URL: z.string().url('Invalid casino API URL').optional(),
  
  // File Upload
  UPLOAD_MAX_SIZE: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).default('5242880'), // 5MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_CSP_REPORTING: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ADMIN_PANEL: z.string().transform(val => val === 'true').default('true'),
})

// Type for validated environment variables
export type ValidatedEnv = z.infer<typeof envSchema>

// Validated environment variables
let validatedEnv: ValidatedEnv | null = null

/**
 * Validate environment variables
 * Should be called at application startup
 */
export function validateEnvironment(): ValidatedEnv {
  try {
    // Parse and validate environment variables
    const parsed = envSchema.parse(process.env) as ValidatedEnv
    validatedEnv = parsed
    
    logger.info('Environment validation successful', {
      component: 'env-validator',
      action: 'validate',
      metadata: {
        nodeEnv: parsed.NODE_ENV,
        siteUrl: parsed.NEXT_PUBLIC_SITE_URL,
        hasSupabase: !!parsed.NEXT_PUBLIC_SUPABASE_URL,
        hasRedis: !!parsed.REDIS_URL,
        analyticsEnabled: parsed.ENABLE_ANALYTICS,
        rateLimitingEnabled: parsed.ENABLE_RATE_LIMITING
      }
    })
    
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      
      logger.error('Environment validation failed', new Error(`Invalid environment variables: ${errorMessages}`), {
        component: 'env-validator',
        action: 'validate',
        metadata: {
          errors: error.errors,
          missingVars: error.errors.filter(err => err.code === 'invalid_type').map(err => err.path.join('.'))
        }
      })
      
      throw new Error(`Environment validation failed: ${errorMessages}`)
    }
    
    logger.error('Unexpected error during environment validation', error as Error)
    throw error
  }
}

/**
 * Get validated environment variables
 * Throws error if validation hasn't been run
 */
export function getValidatedEnv(): ValidatedEnv {
  if (!validatedEnv) {
    throw new Error('Environment variables have not been validated. Call validateEnvironment() first.')
  }
  return validatedEnv
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return getValidatedEnv().NODE_ENV === 'production'
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return getValidatedEnv().NODE_ENV === 'development'
}

/**
 * Check if environment is test
 */
export function isTest(): boolean {
  return getValidatedEnv().NODE_ENV === 'test'
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  const env = getValidatedEnv()
  return {
    url: env.DATABASE_URL,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY
  }
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig() {
  const env = getValidatedEnv()
  return {
    enabled: env.ENABLE_RATE_LIMITING,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    redisUrl: env.REDIS_URL
  }
}

/**
 * Get security configuration
 */
export function getSecurityConfig() {
  const env = getValidatedEnv()
  return {
    encryptionKey: env.ENCRYPTION_KEY,
    jwtSecret: env.JWT_SECRET,
    nextAuthSecret: env.NEXTAUTH_SECRET,
    cspReportingEnabled: env.ENABLE_CSP_REPORTING
  }
}

/**
 * Get upload configuration
 */
export function getUploadConfig() {
  const env = getValidatedEnv()
  return {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim())
  }
}

/**
 * Validate specific environment variable at runtime
 */
export function validateEnvVar<T>(key: string, schema: z.ZodSchema<T>): T {
  try {
    const value = process.env[key]
    return schema.parse(value)
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Invalid environment variable ${key}`, new Error(error.message), {
        component: 'env-validator',
        action: 'validateEnvVar',
        metadata: { key }
      })
      throw new Error(`Invalid environment variable ${key}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Initialize environment validation
 * Call this at application startup
 */
export function initializeEnvironment(): ValidatedEnv {
  logger.info('Initializing environment validation...', {
    component: 'env-validator',
    action: 'initialize'
  })
  
  try {
    const env = validateEnvironment()
    
    // Log important configuration (without sensitive data)
    logger.info('Application configuration loaded', {
      component: 'env-validator',
      action: 'initialize',
      metadata: {
        environment: env.NODE_ENV,
        siteUrl: env.NEXT_PUBLIC_SITE_URL,
        features: {
          analytics: env.ENABLE_ANALYTICS,
          rateLimiting: env.ENABLE_RATE_LIMITING,
          cspReporting: env.ENABLE_CSP_REPORTING,
          adminPanel: env.ENABLE_ADMIN_PANEL
        }
      }
    })
    
    return env
  } catch (error) {
    logger.error('Failed to initialize environment', error as Error, {
      component: 'env-validator',
      action: 'initialize'
    })
    
    // In production, we should fail fast but Edge Runtime doesn't support process.exit
    // Instead, we throw the error and let the application handle it
    throw error
  }
}