'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminPinDialog } from '@/components/admin-pin-dialog'
import { AdminSetPinDialog } from '@/components/admin-set-pin-dialog'
import ErrorBoundary from '@/components/admin/error-boundary'
import '@/styles/admin.css'

interface PinStatus {
  verified: boolean
  hasPinSet: boolean
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const [pendingNext, setPendingNext] = useState<string | null>(null)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [showSetPinDialog, setShowSetPinDialog] = useState(false)
  const [pinStatus, setPinStatus] = useState<PinStatus | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check PIN status on mount and periodically
  const checkPinStatus = async () => {
    try {
      const response = await fetch('/api/admin/pin-status', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const status: PinStatus = await response.json()
        setPinStatus(status)
        
        // Auto-open appropriate dialog based on status
        if (!status.hasPinSet) {
          setShowSetPinDialog(true)
        } else if (!status.verified) {
          setShowPinDialog(true)
        }
      }
    } catch (error) {
      console.error('Failed to check PIN status:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Initial status check and setup periodic checking
  useEffect(() => {
    checkPinStatus()
    
    // Set up periodic checking every 5 minutes (300000ms)
    timerRef.current = setInterval(checkPinStatus, 300000)
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Fallback: Check for showPin query parameter (for backward compatibility)
  useEffect(() => {
    const showPin = searchParams.get('showPin')
    const next = searchParams.get('next')
    if (next) setPendingNext(next)
    if (showPin === 'true' && pinStatus?.hasPinSet && !pinStatus?.verified) {
      setShowPinDialog(true)
      const url = new URL(window.location.href)
      url.searchParams.delete('showPin')
      // biarkan `next` tetap ada sampai verifikasi sukses
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, pinStatus])

  const handlePinSuccess = () => {
    console.log('✅ PIN verified successfully in admin subdomain')
    setShowPinDialog(false)
    // Update status to reflect successful verification
    setPinStatus(prev => prev ? { ...prev, verified: true } : null)
    // redirect ke tujuan jika ada
    if (pendingNext) {
      const to = pendingNext
      setPendingNext(null)
      window.location.href = to
    }
  }

  const handleSetPinSuccess = () => {
    console.log('✅ PIN set successfully')
    setShowSetPinDialog(false)
    // Update status to reflect PIN is now set
    setPinStatus(prev => prev ? { ...prev, hasPinSet: true } : null)
    // Check status again to determine if verification is needed
    checkPinStatus()
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black admin-theme">
        <AdminSidebar />
        <main className="lg:ml-64 md:ml-16 sm:ml-0 p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      {/* Admin PIN Dialogs */}
      <AdminPinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handlePinSuccess}
      />
      
      <AdminSetPinDialog
        open={showSetPinDialog}
        onOpenChange={setShowSetPinDialog}
        onSuccess={handleSetPinSuccess}
      />
      
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            backdropFilter: 'blur(20px) saturate(180%)',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            color: 'white',
          },
        }}
      />
    </ErrorBoundary>
  )
}