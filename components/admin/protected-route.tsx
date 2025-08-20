'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminAuth } from '@/lib/auth/admin-auth'
import { AdminRole } from '@/lib/auth/admin-auth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: AdminRole
  requiredPermissions?: string[]
  fallback?: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback,
  redirectTo = '/admin/login'
}: ProtectedRouteProps) {
  const adminAuth = AdminAuth.getInstance()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await adminAuth.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }
    loadUser()
  }, [adminAuth])

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push(redirectTo)
        return
      }

      // Check role requirement
      if (requiredRole && !adminAuth.hasRole(requiredRole)) {
        router.push('/admin/unauthorized')
        return
      }

      // Check permission requirements
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          adminAuth.hasPermission(permission)
        )
        
        if (!hasAllPermissions) {
          router.push('/admin/unauthorized')
          return
        }
      }
    }
  }, [user, loading, requiredRole, requiredPermissions, router, redirectTo, adminAuth])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show fallback if not authenticated
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white/70">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Check role requirement
  if (requiredRole && !adminAuth.hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/70">You don&apos;t have the required role to access this page.</p>
        </div>
      </div>
    )
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      adminAuth.hasPermission(permission)
    )
    
    if (!hasAllPermissions) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-white/70">You don&apos;t have the required permissions to access this page.</p>
          </div>
        </div>
      )
    }
  }

  // Render children if all checks pass
  return <>{children}</>
}

// Higher-order component for protecting pages
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: AdminRole
    requiredPermissions?: string[]
    redirectTo?: string
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        requiredRole={options?.requiredRole}
        requiredPermissions={options?.requiredPermissions}
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Component for role-based rendering
interface RoleGuardProps {
  children: ReactNode
  role?: AdminRole
  permissions?: string[]
  fallback?: ReactNode
  requireAll?: boolean // If true, requires all permissions; if false, requires any permission
}

export function RoleGuard({
  children,
  role,
  permissions = [],
  fallback = null,
  requireAll = true
}: RoleGuardProps) {
  const adminAuth = AdminAuth.getInstance()

  // Check role requirement
  if (role && !adminAuth.hasRole(role)) {
    return <>{fallback}</>
  }

  // Check permission requirements
  if (permissions.length > 0) {
    const checkPermissions = requireAll
      ? permissions.every(permission => adminAuth.hasPermission(permission))
      : permissions.some(permission => adminAuth.hasPermission(permission))
    
    if (!checkPermissions) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}