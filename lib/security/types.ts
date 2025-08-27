/**
 * Security System Types
 * Centralized type definitions for the security system
 */

// CSP Types
export interface CSPConfig {
  nonce?: string
  isDevelopment?: boolean
  isProduction?: boolean
}

// Rate Limiting Types
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
  response?: any
}

// Security Headers Types
export interface SecurityContext {
  type: 'api' | 'admin' | 'public' | 'static'
  path: string
  isDevelopment: boolean
  isProduction: boolean
}

export interface SecurityHeadersConfig {
  context: SecurityContext
  nonce?: string
  enableCSP?: boolean
  enableHSTS?: boolean
  enablePermissionsPolicy?: boolean
}

// CSRF Types
export interface CSRFToken {
  token: string
  expires: number
}

export interface CSRFConfig {
  secret: string
  tokenLength?: number
  expiresIn?: number
  cookieName?: string
  headerName?: string
}

// Security Event Types
export interface SecurityEvent {
  type: string
  timestamp: number
  ip: string
  userAgent?: string
  path: string
  method: string
  details?: Record<string, any>
}

// Security Violation Types
export interface SecurityViolation {
  type: 'csp' | 'rate-limit' | 'csrf' | 'xss' | 'injection'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  ip: string
  path: string
  details: Record<string, any>
}

// Security Configuration Types
export interface SecuritySystemConfig {
  enabled: boolean
  csp: {
    enabled: boolean
    reportOnly: boolean
    reportUri?: string
  }
  rateLimiting: {
    enabled: boolean
    defaultLimit: number
    defaultWindow: number
  }
  csrf: {
    enabled: boolean
    tokenLength: number
    expiresIn: number
  }
  headers: {
    enabled: boolean
    hsts: boolean
    permissionsPolicy: boolean
  }
  logging: {
    enabled: boolean
    level: 'debug' | 'info' | 'warn' | 'error'
  }
}

// Security Middleware Types
export interface SecurityMiddlewareConfig {
  enabled: boolean
  csp: boolean
  rateLimiting: boolean
  csrf: boolean
  headers: boolean
  logging: boolean
}

// Security Response Types
export interface SecurityResponse {
  success: boolean
  message: string
  data?: any
  error?: string
  timestamp: number
}

// Security Metrics Types
export interface SecurityMetrics {
  totalRequests: number
  blockedRequests: number
  cspViolations: number
  rateLimitExceeded: number
  csrfFailures: number
  averageResponseTime: number
  lastUpdated: number
}
