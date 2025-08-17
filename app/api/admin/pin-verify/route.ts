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

    // Verify PIN using environment variable
    const adminPin = process.env.ADMIN_PIN;
    
    if (!adminPin) {
      console.error('ADMIN_PIN environment variable not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const isValidPin = pin === adminPin;

    if (!isValidPin) {
      // Log failed attempt with security event
      logSecurityEvent('UNAUTHORIZED_ACCESS', request, { 
        reason: 'invalid_pin', 
        userEmail: user.email,
        endpoint: 'pin-verify'
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

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role, permissions')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
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
      adminId: adminUser.id,
      role: adminUser.role,
      permissions: adminUser.permissions,
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
        id: adminUser.id,
        role: adminUser.role,
        permissions: adminUser.permissions
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