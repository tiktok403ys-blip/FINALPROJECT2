import { NextRequest, NextResponse } from 'next/server';
import { validatePinVerification, validateAdminAuth } from '@/lib/auth/admin-middleware';

/**
 * GET /api/admin/pin-status
 * Returns the current PIN verification status and whether admin has PIN set
 */
export async function GET(request: NextRequest) {
  try {
    // Check if PIN is currently verified
    const isPinVerified = await validatePinVerification(request);
    
    // Validate admin authentication before calling RPC
    const auth = await validateAdminAuth(request);
    if (auth instanceof NextResponse) {
      return auth; // Return auth error response
    }
    
    const { supabase } = auth;
    const { data: hasPinData, error: pinError } = await supabase
      .rpc('admin_has_pin_set');
    
    if (pinError) {
      console.error('Error checking admin PIN status:', pinError);
      return NextResponse.json(
        { error: 'Failed to check PIN status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      verified: isPinVerified,
      hasPinSet: hasPinData || false
    });
    
  } catch (error) {
    console.error('Error in pin-status endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}