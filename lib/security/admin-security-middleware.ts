import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from './rate-limiter';
import { validateCSRFToken, requiresCSRFProtection, createCSRFErrorResponse } from './csrf-protection';

interface SecurityCheckResult {
  allowed: boolean;
  response?: Response;
  headers?: Record<string, string>;
}

/**
 * Comprehensive security middleware for admin endpoints
 * @param request - NextRequest object
 * @returns Promise<SecurityCheckResult>
 */
export async function adminSecurityMiddleware(request: NextRequest): Promise<SecurityCheckResult> {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const clientId = getClientIdentifier(request);
  
  // 1. Rate Limiting Check
  const rateLimitResult = await checkRateLimit(request, clientId, pathname, method);
  if (!rateLimitResult.allowed) {
    return rateLimitResult;
  }
  
  // 2. CSRF Protection Check
  const csrfResult = await checkCSRFProtection(request);
  if (!csrfResult.allowed) {
    return csrfResult;
  }
  
  // All security checks passed
  const isAdminDomain = request.headers.get('origin')?.includes('admin') || false;
  
  return {
    allowed: true,
    headers: {
      ...rateLimitResult.headers,
      ...csrfResult.headers,
      ...getSecurityHeaders(isAdminDomain)
    }
  };
}

/**
 * Rate limiting check for admin endpoints
 * @param request - NextRequest object
 * @param clientId - Client identifier
 * @param pathname - Request pathname
 * @param method - HTTP method
 * @returns Promise<SecurityCheckResult>
 */
async function checkRateLimit(
  request: NextRequest,
  clientId: string,
  pathname: string,
  method: string
): Promise<SecurityCheckResult> {
  let config;
  
  // Determine rate limit config based on endpoint and method
  if (pathname === '/api/admin/pin-verify') {
    config = RATE_LIMIT_CONFIGS.PIN_VERIFICATION;
  } else if (pathname.includes('/api/admin/auth') || pathname.includes('/login')) {
    config = RATE_LIMIT_CONFIGS.ADMIN_LOGIN;
  } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    config = RATE_LIMIT_CONFIGS.ADMIN_MUTATIONS;
  } else {
    config = RATE_LIMIT_CONFIGS.ADMIN_API;
  }
  
  const result = rateLimit(request, clientId, config);
  
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  };
  
  if (!result.success) {
    // Rate limit exceeded
    const response = new Response(
      JSON.stringify({
        error: 'Rate Limit Exceeded',
        message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '60',
          ...headers
        }
      }
    );
    
    return {
      allowed: false,
      response,
      headers
    };
  }
  
  return {
    allowed: true,
    headers
  };
}

/**
 * CSRF protection check for admin endpoints
 * @param request - NextRequest object
 * @returns Promise<SecurityCheckResult>
 */
async function checkCSRFProtection(request: NextRequest): Promise<SecurityCheckResult> {
  // Skip CSRF check if not required
  if (!requiresCSRFProtection(request.method)) {
    return { allowed: true };
  }
  
  // Extract CSRF token from header
  const csrfToken = request.headers.get('x-admin-csrf-token') || request.headers.get('x-csrf-token');
  
  if (!csrfToken) {
    const response = createCSRFErrorResponse('CSRF token missing');
    
    return {
      allowed: false,
      response
    };
  }
  
  const isValid = await validateCSRFToken(request, csrfToken);
   
   if (!isValid) {
     const response = createCSRFErrorResponse('CSRF token validation failed');
     
     return {
       allowed: false,
       response
     };
   }
  
  return {
    allowed: true,
    headers: {
      'X-CSRF-Protected': 'true'
    }
  };
}

/**
 * Log security events for monitoring and audit
 * @param event - Security event type
 * @param request - NextRequest object
 * @param details - Additional details
 */
export function logSecurityEvent(
  event: 'RATE_LIMIT_EXCEEDED' | 'CSRF_VALIDATION_FAILED' | 'UNAUTHORIZED_ACCESS' | 'PIN_VERIFICATION_ERROR' | 'INVALID_PIN_ATTEMPT',
  request: NextRequest,
  details?: Record<string, any>
): void {
  const clientId = getClientIdentifier(request);
  const timestamp = new Date().toISOString();
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  const logEntry = {
    timestamp,
    event,
    clientId,
    pathname,
    method,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ...details
  };
  
  // In production, send to logging service (e.g., Sentry, CloudWatch)
  console.warn('[SECURITY EVENT]', JSON.stringify(logEntry, null, 2));
}

/**
 * Check if IP is in whitelist (for emergency access)
 * @param clientId - Client identifier
 * @returns boolean
 */
export function isWhitelistedIP(clientId: string): boolean {
  const whitelist = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
  return whitelist.includes(clientId);
}

/**
 * Create enterprise-grade security headers for admin responses
 * @param isAdminDomain - Whether request is from admin subdomain
 * @returns Record<string, string>
 */
export function getSecurityHeaders(isAdminDomain: boolean = false): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000';
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.localhost:3000';
  
  const headers: Record<string, string> = {
    // Basic security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // HSTS (HTTP Strict Transport Security)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Permissions Policy (Feature Policy)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'fullscreen=()',
      'picture-in-picture=()'
    ].join(', '),
    
    // Content Security Policy - Development friendly
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://localhost:* http://localhost:*",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: blob: https: http: https://localhost:* http://localhost:*",
      "media-src 'self' data: blob:",
      "connect-src 'self' https://localhost:* http://localhost:* ws://localhost:* wss://localhost:* https://gzslsakmkoxfhcyifgtb.supabase.co https://*.supabase.co https://accounts.google.com https://*.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://gzslsakmkoxfhcyifgtb.supabase.co https://*.supabase.co https://accounts.google.com",
      "frame-ancestors 'none'"
    ].join('; '),
    
    // Cross-Origin policies
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site'
  };
  
  // CORS headers for admin subdomain
  if (isAdminDomain) {
    headers['Access-Control-Allow-Origin'] = adminUrl;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    headers['Access-Control-Allow-Headers'] = [
      'Content-Type',
      'Authorization',
      'X-Admin-CSRF-Token',
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Pragma'
    ].join(', ');
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours
  }
  
  return headers;
}

/**
 * Create CORS preflight response for admin endpoints
 * @param request - NextRequest object
 * @returns Response
 */
export function createCORSPreflightResponse(request: NextRequest): Response {
  const origin = request.headers.get('origin');
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.localhost:3000';
  
  // Only allow CORS from admin subdomain
  const isValidOrigin = origin === adminUrl;
  
  if (!isValidOrigin) {
    return new Response(null, {
      status: 403,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
  
  return new Response(null, {
    status: 200,
    headers: getSecurityHeaders(true)
  });
}