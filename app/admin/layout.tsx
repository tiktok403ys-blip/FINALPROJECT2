'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminPinDialog } from '@/components/admin-pin-dialog'
import ErrorBoundary from '@/components/admin/error-boundary'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const [showPinDialog, setShowPinDialog] = useState(false)

  // Check for showPin query parameter
  useEffect(() => {
    const showPin = searchParams.get('showPin')
    if (showPin === 'true') {
      setShowPinDialog(true)
      // Clean up URL after opening dialog
      const url = new URL(window.location.href)
      url.searchParams.delete('showPin')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handlePinSuccess = () => {
    console.log('✅ PIN verified successfully in admin subdomain')
    setShowPinDialog(false)
    // User is now authenticated and can access admin features
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <AdminSidebar />
        <main className="lg:ml-64 md:ml-16 sm:ml-0 p-4 sm:p-6">
          {children}
        </main>
      </div>
      
      {/* Admin PIN Dialog - triggered by showPin query */}
      <AdminPinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handlePinSuccess}
      />
      
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
  )
}