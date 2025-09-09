'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Toaster } from '@/components/ui/toast'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
// PIN dialogs removed
import { ProtectedRoute } from '@/components/admin/protected-route'
import ErrorBoundary from '@/components/admin/error-boundary'
import '@/styles/admin.css'
 

 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const [pendingNext, setPendingNext] = useState<string | null>(null)

  // Removed PIN checks entirely

  // No periodic checks needed

  // Fallback: Check for showPin query parameter (for backward compatibility)
  useEffect(() => {
    const next = searchParams.get('next')
    if (next) setPendingNext(next)
  }, [searchParams])

  // Removed PIN handlers

  return (
    <ProtectedRoute requiredRole="admin">
      <ErrorBoundary>
        <div className="min-h-screen bg-black admin-theme">
          <AdminSidebar />
          <main className="lg:ml-64 md:ml-16 sm:ml-0 p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
        
        {/* PIN dialogs removed */}
        
        <Toaster />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}