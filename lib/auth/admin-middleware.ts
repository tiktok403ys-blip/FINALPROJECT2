import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { AdminAuth, AdminProfile } from '@/lib/auth/admin-auth'
import { cookies } from 'next/headers'

// JWT_SECRET will be retrieved lazily when needed

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
 * Uses AdminAuth system with Supabase authentication
 * @param request - NextRequest object
 * @param requiredPermissions - Optional array of required permissions
 * @returns AdminAuthResult or NextResponse with error
 */
export async function validateAdminAuth(
  request: NextRequest,
  requiredPermissions?: string[]
): Promise<AdminAuthResult | NextResponse> {
  try {
    // Use AdminAuth system
    const adminAuth = AdminAuth.getInstance();
    
    // Check if user is authenticated
    if (!adminAuth.isAuthenticated()) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }
    
    // Get current user and profile
    const { user, profile: adminProfile } = await adminAuth.getCurrentUser();

    if (!user || !adminProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Create Supabase client for compatibility
    const supabase = await createClient();
    
    // Check if admin profile is active
    if (!adminProfile.is_active) {
      return NextResponse.json(
        { error: 'Access denied - Account is inactive' },
        { status: 403 }
      );
    }

    // Check permissions using AdminAuth
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every((permission) =>
        adminAuth.hasPermission(permission)
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
      adminUser: {
        id: adminProfile.id,
        user_id: adminProfile.user_id,
        role: adminProfile.role,
        permissions: adminProfile.permissions,
        is_active: adminProfile.is_active
      },
      supabase
    };
  } catch (error) {
    logger.error('Admin auth validation error:', error as Error);
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

    // Simple PIN token validation (basic check)
    return Boolean(token && token.startsWith('pin_'));
  } catch (error) {
    logger.error('PIN verification failed:', error as Error);
    return false;
  }
}

// Removed getSessionToken function as it's no longer needed with AdminAuth

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