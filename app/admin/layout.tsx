'use client'

import { AdminAuthProvider } from '@/hooks/use-admin-auth'
import { Toaster } from '@/components/ui/sonner'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import ErrorBoundary from '@/components/admin/error-boundary'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <AdminSidebar />
          <main className="lg:ml-64 md:ml-16 sm:ml-0 p-4 sm:p-6">
            {children}
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
            },
          }}
        />
      </ErrorBoundary>
    </AdminAuthProvider>
  )
}