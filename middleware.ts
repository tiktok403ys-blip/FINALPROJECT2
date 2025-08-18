import { NextRequest, NextResponse } from 'next/server';
import { adminSecurityMiddleware, createCORSPreflightResponse, getSecurityHeaders } from './lib/security/admin-security-middleware';
import { validatePinVerification } from './lib/auth/admin-middleware';

/**
 * Check if request is from admin subdomain
 * @param request - NextRequest object
 * @returns boolean
 */
function isAdminDomain(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'admin.localhost:3000';
  const adminHost = adminUrl.replace(/^https?:\/\//, '');
  
  return host === adminHost || host.startsWith('admin.');
}

/**
 * Validate admin subdomain access for admin routes
 * @param request - NextRequest object
 * @returns boolean
 */
function validateAdminSubdomainAccess(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  
  // Admin routes should only be accessible from admin subdomain
  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/admin')) {
    return isAdminDomain(request);
  }
  
  return true;
}

/**
 * Global middleware for handling security and CORS
 * @param request - NextRequest object
 * @returns NextResponse
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isFromAdminDomain = isAdminDomain(request);
  
  // Validate admin subdomain access
  if (!validateAdminSubdomainAccess(request)) {
    return new NextResponse(
      JSON.stringify({ error: 'Access denied: Admin routes require admin subdomain' }),
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders(false)
        }
      }
    );
  }
  
  // Validate PIN for admin page routes (not API routes, handled separately above)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin/')) {
    const isPinVerified = await validatePinVerification(request);
    
    if (!isPinVerified) {
      // Stay on admin subdomain; redirect to /admin with showPin=true to trigger dialog
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      url.searchParams.set('showPin', 'true');
      return NextResponse.redirect(url);
    }
  }
  
  // Handle CORS preflight requests for admin API
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/admin/')) {
    return createCORSPreflightResponse(request);
  }
  
  // Apply security middleware to admin API endpoints
  if (pathname.startsWith('/api/admin/')) {
    // Skip PIN validation for PIN verification endpoint itself
    if (!pathname.startsWith('/api/admin/pin-verify')) {
      // Validate PIN verification first
      const isPinVerified = await validatePinVerification(request);
      
      if (!isPinVerified) {
        return new NextResponse(
          JSON.stringify({ error: 'PIN verification required', code: 'PIN_REQUIRED' }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...getSecurityHeaders(isFromAdminDomain)
            }
          }
        );
      }
    }
    
    const securityResult = await adminSecurityMiddleware(request);
    
    if (!securityResult.allowed) {
      // Security check failed, return the error response
      return securityResult.response || new NextResponse(
        JSON.stringify({ error: 'Security check failed' }),
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders(isFromAdminDomain)
          }
        }
      );
    }
    
    // Security check passed, create response with security headers
    const response = NextResponse.next();
    
    // Add comprehensive security headers
    const securityHeaders = getSecurityHeaders(isFromAdminDomain);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add additional headers from security result
    if (securityResult.headers) {
      Object.entries(securityResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  }
  
  // For all other routes, apply basic security headers
  const response = NextResponse.next();
  const basicSecurityHeaders = getSecurityHeaders(isFromAdminDomain);
  
  Object.entries(basicSecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    // Match all routes except static files and internal Next.js routes
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
    // Specifically include admin routes
    '/admin/:path*',
    '/api/admin/:path*',
    // Include API routes for security headers
    '/api/:path*'
  ],
};