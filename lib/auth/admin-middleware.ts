import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  is_active: boolean;
}

export interface AdminAuthResult {
  user: any;
  adminUser: AdminUser;
  supabase: any;
}

/**
 * Validates admin authentication and role for API routes
 * @param request - NextRequest object
 * @param requiredPermissions - Optional array of required permissions
 * @returns AdminAuthResult or NextResponse with error
 */
export async function validateAdminAuth(
  request: NextRequest,
  requiredPermissions?: string[]
): Promise<AdminAuthResult | NextResponse> {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Get admin user data from admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Access denied - Admin role required' },
        { status: 403 }
      );
    }

    // Check if user has required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = adminUser.permissions || [];
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasRequiredPermissions) {
        return NextResponse.json(
          { error: `Access denied - Required permissions: ${requiredPermissions.join(', ')}` },
          { status: 403 }
        );
      }
    }

    return {
      user,
      adminUser,
      supabase
    };
  } catch (error) {
    console.error('Admin auth validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validates PIN verification token from HttpOnly cookie
 * @param request - NextRequest object
 * @returns boolean indicating if PIN is verified
 */
export async function validatePinVerification(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-pin-verified')?.value;

    if (!token) {
      return false;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.verified === true;
  } catch (error) {
    console.error('PIN verification failed:', error);
    return false;
  }
}

/**
 * Combined validation for admin auth + PIN verification
 * @param request - NextRequest object
 * @param requiredPermissions - Optional array of required permissions
 * @returns AdminAuthResult or NextResponse with error
 */
export async function validateAdminWithPin(
  request: NextRequest,
  requiredPermissions?: string[]
): Promise<AdminAuthResult | NextResponse> {
  // First validate admin authentication
  const authResult = await validateAdminAuth(request, requiredPermissions);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  // Then validate PIN verification
  const isPinVerified = await validatePinVerification(request);
  
  if (!isPinVerified) {
    return NextResponse.json(
      { error: 'PIN verification required' },
      { status: 403 }
    );
  }

  return authResult;
}