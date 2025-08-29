import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface AdminRouteGuardResult {
  isAuthorized: boolean
  user: any | null
  adminUser: any | null
  redirectUrl?: string
}

/**
 * Admin Route Guard - Protects admin routes from unauthorized access
 * Returns 404 for unauthorized users instead of redirecting
 */
export async function guardAdminRoute(
  request: NextRequest,
  requireRole: 'admin' | 'super_admin' = 'admin'
): Promise<AdminRouteGuardResult | NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      logger.warn(`Unauthorized access attempt to admin route: ${request.nextUrl.pathname}`)
      
      // Return 404 for unauthorized users
      return new NextResponse('Not Found', { status: 404 })
    }
    
    // Check if user has admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_active, role, permissions')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (adminError || !adminUser) {
      logger.warn(`Non-admin user attempting to access admin route: ${request.nextUrl.pathname}, User ID: ${user.id}`)
      
      // Return 404 for non-admin users
      return new NextResponse('Not Found', { status: 404 })
    }
    
    // Check role requirement
    if (requireRole === 'super_admin' && adminUser.role !== 'super_admin') {
      logger.warn(`Admin user attempting to access super_admin route: ${request.nextUrl.pathname}, User ID: ${user.id}, Role: ${adminUser.role}`)
      
      // Return 404 for insufficient role
      return new NextResponse('Not Found', { status: 404 })
    }
    
    // User is authorized
    logger.info(`Admin route access granted: ${request.nextUrl.pathname}, User ID: ${user.id}, Role: ${adminUser.role}`)
    
    return {
      isAuthorized: true,
      user,
      adminUser
    }
    
  } catch (error) {
    logger.error('Admin route guard error', error as Error)
    
    // Return 404 on error
    return new NextResponse('Not Found', { status: 404 })
  }
}

/**
 * Check if user can access admin panel
 * Used for UI components to show/hide admin elements
 */
export async function canAccessAdminPanel(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false
    
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('is_active, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    return !!adminUser && ['admin', 'super_admin'].includes(adminUser.role)
  } catch (error) {
    return false
  }
}
