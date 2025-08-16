'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { adminAuth, AdminUser, AdminRole } from '@/lib/auth/admin-auth'
import { supabase } from '@/lib/auth/admin-auth'
import { toast } from '@/lib/toast'

interface AdminAuthContextType {
  user: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: AdminRole) => boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check initial auth state
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await adminAuth.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const { user: authUser, error } = await adminAuth.signIn(email, password)
      
      if (error) {
        toast.error(error.message || 'Login failed')
        return false
      }
      
      if (authUser) {
        setUser(authUser)
        toast.success('Login successful')
        return true
      }
      
      return false
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true)
      await adminAuth.signOut()
      setUser(null)
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Logout failed')
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await adminAuth.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    }
  }

  const hasPermission = (permission: string): boolean => {
    return adminAuth.hasPermission(permission)
  }

  const hasRole = (role: AdminRole): boolean => {
    return adminAuth.hasRole(role)
  }

  const isAuthenticated = adminAuth.isAuthenticated()

  const value: AdminAuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    hasPermission,
    hasRole,
    isAuthenticated,
    refreshUser
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

// Hook for checking specific permissions
export function usePermission(permission: string): boolean {
  const { hasPermission } = useAdminAuth()
  return hasPermission(permission)
}

// Hook for checking specific roles
export function useRole(role: AdminRole): boolean {
  const { hasRole } = useAdminAuth()
  return hasRole(role)
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAdminAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      window.location.href = '/admin/login'
    }
  }, [user, loading])
  
  return { user, loading }
}