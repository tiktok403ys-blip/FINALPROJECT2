import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSecurityMiddleware, logSecurityEvent, getSecurityHeaders } from '@/lib/security/admin-security-middleware';
import { validateAdminAuth } from '@/lib/auth/admin-middleware';

interface SetPinRequest {
  newPin: string;
  confirmPin: string;
}

export async function POST(request: NextRequest) {
  try {
    // Security middleware check
    const securityResult = await adminSecurityMiddleware(request);
    if (!securityResult.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', request, { endpoint: 'set-pin' });
      return securityResult.response!;
    }

    // Validate admin authentication
    const authResult = await validateAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, adminUser, supabase } = authResult;
    const body: SetPinRequest = await request.json();
    const { newPin, confirmPin } = body;

    // Validate input
    if (!newPin || !confirmPin) {
      return NextResponse.json(
        { error: 'Both newPin and confirmPin are required' },
        { status: 400 }
      );
    }

    if (newPin !== confirmPin) {
      return NextResponse.json(
        { error: 'PIN confirmation does not match' },
        { status: 400 }
      );
    }

    if (newPin.length < 4) {
      return NextResponse.json(
        { error: 'PIN must be at least 4 characters long' },
        { status: 400 }
      );
    }

    if (newPin.length > 20) {
      return NextResponse.json(
        { error: 'PIN must be no more than 20 characters long' },
        { status: 400 }
      );
    }

    // Set the new PIN using the database function
    const { data: result, error: pinError } = await supabase
      .rpc('set_admin_pin', {
        new_pin: newPin
      });

    if (pinError) {
      logSecurityEvent('PIN_VERIFICATION_ERROR', request, {
        endpoint: 'set-pin',
        userEmail: user.email,
        error: pinError.message
      });
      console.error('PIN set error:', pinError);
      return NextResponse.json(
        { error: 'Failed to set PIN' },
        {
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }

    if (!result) {
      logSecurityEvent('PIN_VERIFICATION_ERROR', request, {
        endpoint: 'set-pin',
        userEmail: user.email,
        reason: 'function_returned_false'
      });
      return NextResponse.json(
        { error: 'Failed to set PIN - insufficient permissions' },
        {
          status: 403,
          headers: getSecurityHeaders()
        }
      );
    }

    // Log successful PIN set (using console.log since success events are not in security event types)
    console.log('PIN_SET_SUCCESS:', {
      endpoint: 'set-pin',
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { success: true, message: 'PIN set successfully' },
      {
        headers: {
          ...getSecurityHeaders(),
          ...securityResult.headers
        }
      }
    );

  } catch (error) {
    console.error('Set PIN endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if admin has PIN set
export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { supabase } = authResult;

    // Check if admin has PIN set
    const { data: hasPinSet, error } = await supabase
      .rpc('admin_has_pin_set');

    if (error) {
      console.error('Check PIN status error:', error);
      return NextResponse.json(
        { error: 'Failed to check PIN status' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { hasPinSet: !!hasPinSet },
      { headers: getSecurityHeaders() }
    );

  } catch (error) {
    console.error('Check PIN status endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}