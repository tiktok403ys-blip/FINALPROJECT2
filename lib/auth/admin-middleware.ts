import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { enhancedAdminAuth, AdminProfile } from '@/lib/auth/admin-auth-enhanced'
import { getValidatedEnv } from '@/lib/config/env-validator'
import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'

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
 * Uses enhanced authentication system with bcrypt and session validation
 * @param request - NextRequest object
 * @param requiredPermissions - Optional array of required permissions
 * @returns AdminAuthResult or NextResponse with error
 */
export async function validateAdminAuth(
  request: NextRequest,
  requiredPermissions?: string[]
): Promise<AdminAuthResult | NextResponse> {
  try {
    // Try enhanced authentication first (session-based with bcrypt)
    const sessionToken = getSessionToken(request);
    
    if (sessionToken) {
      const adminProfile = await enhancedAdminAuth.validateSession(sessionToken);
      
      if (adminProfile) {
        // Check permissions using enhanced auth
        if (requiredPermissions && requiredPermissions.length > 0) {
          const userPermissions = adminProfile.permissions || [];
          const isSuperAdmin = adminProfile.role === 'super_admin';
          const hasWildcardAll = userPermissions.includes('all');

          const hasRequiredPermissions = requiredPermissions.every((permission) =>
            isSuperAdmin || hasWildcardAll || userPermissions.includes(permission)
          );
          
          if (!hasRequiredPermissions) {
            return NextResponse.json(
              { error: `Access denied - Required permissions: ${requiredPermissions.join(', ')}` },
              { status: 403 }
            );
          }
        }
        
        // Create Supabase client for backward compatibility
        const supabase = await createClient();
        
        return {
          user: { id: adminProfile.id, email: adminProfile.email },
          adminUser: {
            id: adminProfile.id,
            user_id: adminProfile.id,
            role: adminProfile.role,
            permissions: adminProfile.permissions,
            is_active: adminProfile.is_active
          },
          supabase
        };
      }
    }
    
    // Fallback to legacy Supabase auth for backward compatibility
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
      const userPermissions = (adminUser.permissions || []) as string[];
      // Super admin or wildcard 'all' permission should pass any permission check
      const isSuperAdmin = adminUser.role === 'super_admin';
      const hasWildcardAll = userPermissions.includes('all');

      const hasRequiredPermissions = requiredPermissions.every((permission) =>
        isSuperAdmin || hasWildcardAll || userPermissions.includes(permission)
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

    // Use enhanced admin auth to validate PIN token
    const isValid = await enhancedAdminAuth.validateSession(token);
    return isValid !== null;
  } catch (error) {
    logger.error('PIN verification failed:', error as Error);
    return false;
  }
}

/**
 * Helper function to extract session token from request
 * @param request - NextRequest object
 * @returns session token or null
 */
function getSessionToken(request: NextRequest): string | null {
  // Try to get session token from cookie first
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('admin_session='));
    if (sessionCookie) {
      return sessionCookie.split('=')[1];
    }
  }
  
  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
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