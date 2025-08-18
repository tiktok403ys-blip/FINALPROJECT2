import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { adminSecurityMiddleware, logSecurityEvent, getSecurityHeaders } from '@/lib/security/admin-security-middleware';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface PinVerifyRequest {
  pin: string;
}

export async function POST(request: NextRequest) {
  try {
    // Security middleware check - very strict for PIN verification
    const securityResult = await adminSecurityMiddleware(request);
    if (!securityResult.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', request, { endpoint: 'pin-verify' });
      return securityResult.response!;
    }

    const body: PinVerifyRequest = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate PIN using database RPC function
    const { data: pinResult, error: pinError } = await supabase
      .rpc('verify_admin_pin', {
        input_pin: pin
      });

    if (pinError) {
      logSecurityEvent('PIN_VERIFICATION_ERROR', request, { 
        endpoint: 'pin-verify',
        userEmail: user.email,
        error: pinError.message 
      });
      console.error('PIN verification error:', pinError);
      return NextResponse.json(
        { error: 'PIN verification failed' },
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }

    // Check if PIN validation result is valid
    const isValidPin = pinResult && pinResult.length > 0 && pinResult[0]?.is_valid;
    
    if (!isValidPin) {
      logSecurityEvent('INVALID_PIN_ATTEMPT', request, { 
        endpoint: 'pin-verify',
        userEmail: user.email 
      });
      console.warn(`Failed PIN attempt for user: ${user.email}`);
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { 
          status: 403,
          headers: getSecurityHeaders()
        }
      );
    }
    
    // Get admin info from PIN verification result
    const adminInfo = pinResult[0];

    // Admin info is already validated by verify_admin_pin function
    if (!adminInfo.role) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', request, { 
        reason: 'non_admin_user', 
        userEmail: user.email,
        endpoint: 'pin-verify'
      });
      console.warn(`Non-admin user attempted PIN verification: ${user.email}`);
      return NextResponse.json(
        { error: 'Access denied' },
        { 
          status: 403,
          headers: getSecurityHeaders()
        }
      );
    }

    // Create signed JWT token for PIN verification
    const token = await new SignJWT({
      userId: user.id,
      adminUserId: adminInfo.user_id,
      role: adminInfo.role,
      permissions: adminInfo.permissions,
      verified: true,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2) // 2 hours
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(JWT_SECRET);

    // Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-pin-verified', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/admin'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: adminInfo.user_id,
        role: adminInfo.role,
        permissions: adminInfo.permissions
      }
    }, {
      headers: {
        ...getSecurityHeaders(),
        ...securityResult.headers
      }
    });

  } catch (error) {
    console.error('PIN verification endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to verify PIN token from cookie (moved to admin-middleware.ts)
// This function is now available in lib/auth/admin-middleware.ts as validatePinVerification