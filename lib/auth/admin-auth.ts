import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export type AdminRole = 'super_admin' | 'admin'

export interface AdminUser extends User {
  role?: AdminRole
  permissions?: string[]
}

export interface AdminProfile {
  id: string
  email: string
  role: AdminRole
  permissions: string[]
  created_at: string
  updated_at: string
}

/**
 * Consolidated Admin Authentication System
 * Single source of truth using admin_users table
 */
export class AdminAuth {
  private static instance: AdminAuth
  private currentUser: AdminUser | null = null
  private currentProfile: AdminProfile | null = null
  private supabase = createClient()

  private constructor() {}

  static getInstance(): AdminAuth {
    if (!AdminAuth.instance) {
      AdminAuth.instance = new AdminAuth()
    }
    return AdminAuth.instance
  }

  /**
   * Get current authenticated user with admin profile
   */
  async getCurrentUser(): Promise<{ user: AdminUser | null; profile: AdminProfile | null }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        this.currentUser = null
        this.currentProfile = null
        return { user: null, profile: null }
      }

      // Get admin profile from admin_users table (single source of truth)
      const { data: adminData, error: adminError } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (adminError || !adminData) {
        this.currentUser = null
        this.currentProfile = null
        return { user: null, profile: null }
      }

      this.currentUser = {
        ...user,
        role: adminData.role,
        permissions: adminData.permissions || []
      }

      this.currentProfile = {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions || [],
        created_at: adminData.created_at,
        updated_at: adminData.updated_at
      }

      return { user: this.currentUser, profile: this.currentProfile }
    } catch (error) {
      console.error('Error getting current user:', error)
      this.currentUser = null
      this.currentProfile = null
      return { user: null, profile: null }
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.currentUser || !this.currentProfile) return false
    
    // Super admin has all permissions
    if (this.currentProfile.role === 'super_admin') return true
    
    // Check specific permissions
    return this.currentProfile.permissions?.includes(permission) || false
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: AdminRole): boolean {
    return this.currentProfile?.role === role
  }

  /**
   * Check if user is authenticated admin
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentProfile !== null
  }

  /**
   * Check if user is admin (admin or super_admin)
   */
  isAdmin(): boolean {
    return this.currentProfile?.role === 'admin' || this.currentProfile?.role === 'super_admin'
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(): boolean {
    return this.currentProfile?.role === 'super_admin'
  }

  /**
   * Log admin action to audit trail
   */
  async logAdminAction(
    action_type: string,
    module_name: string,
    item_id?: string,
    details?: any
  ): Promise<void> {
    if (!this.currentUser || !this.currentProfile) {
      console.warn('Cannot log admin action: User not authenticated')
      return
    }

    try {
      await this.supabase.from('admin_actions').insert({
        user_id: this.currentUser.id,
        email: this.currentUser.email,
        action_type,
        module_name,
        item_id: item_id || null,
        details: details || {},
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log admin action:', error)
    }
  }

  /**
   * Sign in admin user
   */
  async signIn(email: string, password: string): Promise<boolean> {
    try {
      // Sign in with Supabase Auth
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error || !data.user) {
        console.error('Auth error:', error)
        return false
      }

      // Check if user exists in admin_users table
      const { data: adminData, error: adminError } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (adminError || !adminData) {
        console.error('Admin verification error:', adminError)
        // Sign out if not admin
        await this.supabase.auth.signOut()
        return false
      }

      // Set current user and profile
      this.currentUser = {
        ...data.user,
        role: adminData.role,
        permissions: adminData.permissions || []
      }

      this.currentProfile = {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions || [],
        created_at: adminData.created_at,
        updated_at: adminData.updated_at
      }

      // Log successful login
      await this.logAdminAction('admin_login', 'auth', undefined, {
        user_id: data.user.id,
        email: data.user.email
      })

      return true
    } catch (error) {
      console.error('Sign in error:', error)
      return false
    }
  }

  /**
   * Sign out admin user
   */
  async signOut(): Promise<{ error: any }> {
    try {
      if (this.currentUser && this.currentProfile) {
        await this.logAdminAction('admin_logout', 'auth', undefined, {
          user_id: this.currentUser.id,
          email: this.currentUser.email
        })
      }

      const { error } = await this.supabase.auth.signOut()
      this.currentUser = null
      this.currentProfile = null
      return { error }
    } catch (error) {
      return { error }
    }
  }

  /**
   * Clear local state (for use when redirecting)
   */
  clearState(): void {
    this.currentUser = null
    this.currentProfile = null
  }
}

// Export singleton instance
export const adminAuth = AdminAuth.getInstance()