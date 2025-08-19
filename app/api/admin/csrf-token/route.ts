import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAuth } from '@/lib/auth/admin-middleware';
import { createCSRFToken } from '@/lib/security/csrf-protection';
import { adminSecurityMiddleware, logSecurityEvent, getSecurityHeaders } from '@/lib/security/admin-security-middleware';

/**
 * GET /api/admin/csrf-token
 * Returns a CSRF token for admin operations
 */
export async function GET(request: NextRequest) {
  try {
    // Security middleware check (rate limiting only, no CSRF for GET)
    const securityResult = await adminSecurityMiddleware(request);
    if (!securityResult.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', request, { endpoint: 'csrf-token' });
      return securityResult.response!;
    }

    // Optional: try to validate admin auth, but do not block token issuance
    // CSRF token sendiri tidak sensitif dan tidak memberi akses tanpa sesi yang valid
    try {
      const authResult = await validateAdminAuth(request, ['read_admin']);
      if (!(authResult instanceof NextResponse)) {
        // proceed silently
      }
    } catch {}

    // Generate new CSRF token
    const { token, cookie } = createCSRFToken();

    // Return token in response body and set cookie
    const response = NextResponse.json(
      { 
        csrfToken: token,
        message: 'CSRF token generated successfully'
      },
      {
        headers: {
          ...getSecurityHeaders(),
          ...securityResult.headers
        }
      }
    );

    // Set CSRF token cookie
    response.headers.set('Set-Cookie', cookie);

    return response;

  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
}