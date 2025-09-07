import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { AdminAuth, AdminProfile } from '@/lib/auth/admin-auth'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

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
 * Accepts legacy non-JWT tokens (prefix 'pin_') and new JWT tokens (signed with JWT_SECRET)
 * @param request - NextRequest object
 * @returns boolean indicating if PIN is verified
 */
export async function validatePinVerification(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_pin_verified')?.value;

    if (!token) {
      return false;
    }

    // Legacy non-JWT tokens are no longer accepted for security reasons
    if (token.startsWith('pin_')) {
      return false;
    }

    // Verify JWT-based PIN token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

    try {
      const { payload } = await jwtVerify(token, secret);

      // If AdminAuth is available, ensure the token subject matches current user
      try {
        const adminAuth = AdminAuth.getInstance();
        if (adminAuth.isAuthenticated()) {
          const { user } = await adminAuth.getCurrentUser();
          if (user?.id && payload?.sub && payload.sub !== user.id) {
            return false;
          }
        }
      } catch (e) {
        // Non-fatal: if we fail to read current user, rely on JWT validity + claim
      }

      // Require explicit verified flag and correct purpose in payload
      const p = payload as any
      if (p?.verified !== true) return false
      if (p?.purpose !== 'admin_pin') return false
      return true
    } catch (e) {
      logger.error('PIN JWT verification failed:', e as Error);
      return false;
    }
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