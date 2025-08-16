import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AdminRole = 'super_admin' | 'admin'

export interface AdminUser extends User {
  role?: AdminRole
  permissions?: string[]
}

export class AdminAuth {
  private static instance: AdminAuth
  private currentUser: AdminUser | null = null

  private constructor() {}

  static getInstance(): AdminAuth {
    if (!AdminAuth.instance) {
      AdminAuth.instance = new AdminAuth()
    }
    return AdminAuth.instance
  }

  async signIn(email: string, password: string): Promise<{ user: AdminUser | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { user: null, error }
      }

      if (data.user) {
        // Get admin role from admin_users table
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('role, permissions')
          .eq('user_id', data.user.id)
          .single()

        if (adminError || !adminData) {
          await this.signOut()
          return { user: null, error: { message: 'Unauthorized: Not an admin user' } }
        }

        this.currentUser = {
          ...data.user,
          role: adminData.role,
          permissions: adminData.permissions || []
        }

        // Log admin login
        await this.logActivity('admin_login', {
          user_id: data.user.id,
          email: data.user.email
        })

        return { user: this.currentUser, error: null }
      }

      return { user: null, error: { message: 'Authentication failed' } }
    } catch (error) {
      return { user: null, error }
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      if (this.currentUser) {
        await this.logActivity('admin_logout', {
          user_id: this.currentUser.id
        })
      }

      const { error } = await supabase.auth.signOut()
      this.currentUser = null
      return { error }
    } catch (error) {
      return { error }
    }
  }

  async getCurrentUser(): Promise<AdminUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        this.currentUser = null
        return null
      }

      // Get admin role from admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role, permissions')
        .eq('user_id', user.id)
        .single()

      if (adminError || !adminData) {
        this.currentUser = null
        return null
      }

      this.currentUser = {
        ...user,
        role: adminData.role,
        permissions: adminData.permissions || []
      }

      return this.currentUser
    } catch (error) {
      this.currentUser = null
      return null
    }
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false
    
    // Super admin has all permissions
    if (this.currentUser.role === 'super_admin') return true
    
    // Check specific permissions
    return this.currentUser.permissions?.includes(permission) || false
  }

  hasRole(role: AdminRole): boolean {
    return this.currentUser?.role === role
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  private async logActivity(action: string, metadata: any): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        action,
        metadata,
        user_id: this.currentUser?.id,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  async refreshSession(): Promise<{ user: AdminUser | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error || !data.user) {
        this.currentUser = null
        return { user: null, error }
      }

      return await this.getCurrentUser().then(user => ({ user, error: null }))
    } catch (error) {
      return { user: null, error }
    }
  }
}

export const adminAuth = AdminAuth.getInstance()