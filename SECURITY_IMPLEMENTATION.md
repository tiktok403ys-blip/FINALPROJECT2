# Next.js Compatible Security System Implementation

## Overview

This document describes the implementation of a security system that is fully compatible with Next.js and doesn't interfere with its functionality.

## Problem Solved

The previous security system was blocking all JavaScript scripts due to overly restrictive Content Security Policy (CSP), causing:
- Next.js framework scripts to be blocked
- Application functionality to break
- Google Analytics and other essential services to fail

## Solution Implemented

### 1. Content Security Policy (CSP) - Next.js Compatible

**File:** `lib/security/nextjs-compatible-csp.ts`

- **Allows Next.js Scripts**: Includes `'unsafe-eval'` and `'unsafe-inline'` for Next.js compatibility
- **Nonce-based Security**: Generates cryptographically secure nonces for inline scripts
- **Flexible Domains**: Allows Google Analytics, Supabase, and other essential services
- **Environment-aware**: Different policies for development vs production

**Key Features:**
```typescript
// Allows Next.js development features
'unsafe-eval' // Required for Next.js webpack
'unsafe-inline' // Required for Next.js inline scripts
`'nonce-${nonce}'` // Secure nonce-based scripts
```

### 2. Rate Limiting - Simple and Effective

**File:** `lib/security/simple-rate-limiter.ts`

- **In-Memory Storage**: Lightweight and fast
- **Configurable Limits**: Different limits for different route types
- **Automatic Cleanup**: Prevents memory leaks
- **Next.js Compatible**: No external dependencies

**Pre-configured Limiters:**
```typescript
api: 100 requests per 15 minutes
admin: 50 requests per 15 minutes  
auth: 10 requests per 15 minutes
public: 200 requests per 15 minutes
```

### 3. Security Headers - Context-Aware

**File:** `lib/security/nextjs-security-headers.ts`

- **Context-based Headers**: Different headers for API, admin, public, and static routes
- **HSTS Support**: HTTP Strict Transport Security (production only)
- **Permissions Policy**: Modern replacement for Feature Policy
- **Cache Control**: Appropriate caching for different content types

**Header Types:**
- **API Routes**: No-cache, strict CORS
- **Admin Routes**: No-cache, no-index, enhanced security
- **Static Assets**: Long-term caching, cross-origin allowed
- **Public Pages**: Standard security, moderate caching

### 4. CSRF Protection - Lightweight

**File:** `lib/security/simple-csrf.ts`

- **Token-based Protection**: Generates and validates CSRF tokens
- **Multiple Sources**: Header, cookie, and form data support
- **Automatic Cleanup**: Expired token management
- **Next.js Integration**: Works with Next.js forms and API routes

## Usage Examples

### Basic Security Headers
```typescript
import { nextjsSecurityHeaders } from '@/lib/security'

// Apply security headers to response
const response = NextResponse.next()
const context = nextjsSecurityHeaders.getSecurityContext(request)
nextjsSecurityHeaders.applyHeaders(request, response, context)
```

### Rate Limiting
```typescript
import { rateLimiters } from '@/lib/security'

// Check if request is allowed
const result = rateLimiters.api.isAllowed(clientIP)
if (!result.allowed) {
  return result.response
}
```

### CSP Generation
```typescript
import { nextjsCSP } from '@/lib/security'

// Generate CSP directives
const csp = nextjsCSP.generateCSPDirectives({
  nonce: 'abc123...',
  isDevelopment: process.env.NODE_ENV === 'development'
})
```

## Configuration

### Environment Variables
```bash
# Security Configuration
JWT_SECRET=your-secret-key-here
NODE_ENV=production

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Customization
```typescript
// Custom rate limiter
const customLimiter = new SimpleRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 50,
  message: 'Custom rate limit message'
})

// Custom CSP configuration
const customCSP = nextjsCSP.generateCSPDirectives({
  nonce: 'custom-nonce',
  isDevelopment: false,
  isProduction: true
})
```

## Security Features

### ✅ What's Protected
- **XSS Prevention**: Content Security Policy
- **Clickjacking**: X-Frame-Options
- **MIME Sniffing**: X-Content-Type-Options
- **CSRF Attacks**: Token-based validation
- **Rate Limiting**: DDoS protection
- **Information Disclosure**: Hidden server headers

### ✅ What's Allowed
- **Next.js Scripts**: All framework functionality
- **Google Analytics**: Tracking and analytics
- **Supabase**: Database and authentication
- **External CDNs**: Images and assets
- **Development Tools**: Hot reload and debugging

## Performance Impact

- **Minimal Overhead**: In-memory operations only
- **No Database Calls**: Rate limiting is local
- **Efficient Headers**: Context-aware header generation
- **Lazy Loading**: Security features loaded on demand

## Monitoring and Logging

### Security Events
```typescript
// Rate limit exceeded
logger.warn('Rate limit exceeded', { ip, path, limit })

// CSP violations
logger.warn('CSP violation', { directive, blockedUri, path })

// CSRF failures
logger.warn('CSRF validation failed', { ip, path, token })
```

### Metrics
```typescript
// Rate limiter stats
const stats = rateLimiters.api.getStats()
console.log(`Active rate limits: ${stats.totalIdentifiers}`)

// CSRF stats
const csrfStats = csrfProtection.getStats()
console.log(`Active CSRF tokens: ${csrfStats.activeTokens}`)
```

## Troubleshooting

### Common Issues

1. **Scripts Still Blocked**
   - Check CSP nonce generation
   - Verify script-src directives
   - Ensure Next.js compatibility settings

2. **Rate Limiting Too Strict**
   - Adjust limits in rate limiter configuration
   - Check IP address detection
   - Verify cleanup intervals

3. **CSRF Token Failures**
   - Check token expiration settings
   - Verify cookie settings
   - Check form integration

### Debug Mode
```typescript
// Enable debug logging
logger.setLevel('debug')

// Check security context
const context = nextjsSecurityHeaders.getSecurityContext(request)
console.log('Security context:', context)
```

## Migration Guide

### From Old Security System
1. **Remove old imports**: Delete references to old security modules
2. **Update middleware**: Use new security system
3. **Test functionality**: Ensure scripts load properly
4. **Monitor logs**: Check for security events

### Backward Compatibility
- All existing security features maintained
- Enhanced compatibility with Next.js
- Improved performance and reliability
- Better error handling and logging

## Future Enhancements

- **Redis Integration**: Distributed rate limiting
- **Security Analytics**: Advanced threat detection
- **Automated Response**: Block malicious IPs
- **Policy Management**: Dynamic security configuration

## Conclusion

This security system provides comprehensive protection while maintaining full Next.js compatibility. It's designed to be:
- **Secure**: Protects against common web vulnerabilities
- **Compatible**: Works seamlessly with Next.js
- **Performant**: Minimal impact on application speed
- **Maintainable**: Clean, documented, and extensible

The system successfully resolves the CSP blocking issues while maintaining strong security posture.
