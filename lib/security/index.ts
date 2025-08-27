/**
 * Next.js Compatible Security System
 * Provides security features without interfering with Next.js functionality
 */

// CSP (Content Security Policy)
export { NextJSCompatibleCSP, nextjsCSP } from './nextjs-compatible-csp'

// Security Headers
export { NextJSSecurityHeaders, nextjsSecurityHeaders, createSecurityMiddleware } from './nextjs-security-headers'

// Rate Limiting
export { SimpleRateLimiter, rateLimiters, rateLimitMiddleware, applyRateLimitHeaders } from './simple-rate-limiter'

// CSRF Protection
export { SimpleCSRFProtection, csrfMiddleware, generateCSRFToken, validateCSRFToken } from './simple-csrf'

// Types
export type {
  CSPConfig,
  RateLimitConfig,
  RateLimitResult,
  SecurityContext,
  SecurityHeadersConfig,
  CSRFToken,
  CSRFConfig
} from './types'

// Re-export commonly used functions
export const security = {
  // CSP
  generateCSP: (config?: any) => {
    const { NextJSCompatibleCSP } = require('./nextjs-compatible-csp')
    return NextJSCompatibleCSP.generateCSPDirectives(config)
  },
  generateSecurityHeaders: (config?: any) => {
    const { NextJSSecurityHeaders } = require('./nextjs-security-headers')
    return NextJSSecurityHeaders.generateHeaders(config)
  },
  
  // Rate Limiting
  createRateLimiter: (config?: any) => {
    const { SimpleRateLimiter } = require('./simple-rate-limiter')
    return new SimpleRateLimiter(config)
  },
  rateLimit: (request: any, limiter?: any) => {
    const { rateLimitMiddleware } = require('./simple-rate-limiter')
    return rateLimitMiddleware(request, limiter)
  },
  
  // CSRF
  createCSRF: (config?: any) => {
    const { SimpleCSRFProtection } = require('./simple-csrf')
    return new SimpleCSRFProtection(config)
  },
  csrf: (request: any, response: any, sessionId: string) => {
    const { csrfMiddleware } = require('./simple-csrf')
    return csrfMiddleware(request, response, sessionId)
  },
  
  // Utilities
  generateNonce: () => {
    const { NextJSCompatibleCSP } = require('./nextjs-compatible-csp')
    return NextJSCompatibleCSP.generateCSPDirectives()
  },
  getSecurityContext: (request: any) => {
    const { NextJSSecurityHeaders } = require('./nextjs-security-headers')
    return NextJSSecurityHeaders.getSecurityContext(request)
  }
}

export default security
