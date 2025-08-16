'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/use-admin-auth'
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
  const { user, loading, hasRole, hasPermission } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push(redirectTo)
        return
      }

      // Check role requirement
      if (requiredRole && !hasRole(requiredRole)) {
        router.push('/admin/unauthorized')
        return
      }

      // Check permission requirements
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          hasPermission(permission)
        )
        
        if (!hasAllPermissions) {
          router.push('/admin/unauthorized')
          return
        }
      }
    }
  }, [user, loading, requiredRole, requiredPermissions, hasRole, hasPermission, router, redirectTo])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <p className="text-white/70">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/70">You don't have the required role to access this page.</p>
        </div>
      </div>
    )
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    )
    
    if (!hasAllPermissions) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-white/70">You don't have the required permissions to access this page.</p>
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
  const { hasRole, hasPermission } = useAdminAuth()

  // Check role requirement
  if (role && !hasRole(role)) {
    return <>{fallback}</>
  }

  // Check permission requirements
  if (permissions.length > 0) {
    const checkPermissions = requireAll
      ? permissions.every(permission => hasPermission(permission))
      : permissions.some(permission => hasPermission(permission))
    
    if (!checkPermissions) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}