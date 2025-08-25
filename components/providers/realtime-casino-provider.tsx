// Provider untuk mengelola Supabase Realtime connection secara global
// Memastikan proper error handling dan reconnection management

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useCasinoRealtime } from '@/hooks/use-casino-realtime'
import { toast } from 'sonner'

interface RealtimeCasinoContextType {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastUpdate: number
  reconnectAttempts: number
  reconnect: () => void
  disconnect: () => void
  queueSize: number
}

const RealtimeCasinoContext = createContext<RealtimeCasinoContextType | null>(null)

interface RealtimeCasinoProviderProps {
  children: React.ReactNode
  enabled?: boolean
  showToasts?: boolean
}

export function RealtimeCasinoProvider({ 
  children, 
  enabled = true, 
  showToasts = true 
}: RealtimeCasinoProviderProps) {
  const realtime = useCasinoRealtime({ 
    enabled,
    debounceMs: 300,
    maxReconnectAttempts: 5,
    batchSize: 10
  })

  const [hasShownConnectedToast, setHasShownConnectedToast] = useState(false)
  const [hasShownErrorToast, setHasShownErrorToast] = useState(false)

  // Handle connection status changes dengan toast notifications
  useEffect(() => {
    if (!showToasts) return

    if (realtime.isConnected && !hasShownConnectedToast) {
      toast.success('Casino data realtime terhubung', {
        description: 'Data casino akan diperbarui secara otomatis',
        duration: 3000
      })
      setHasShownConnectedToast(true)
      setHasShownErrorToast(false)
    }

    if (realtime.error && !hasShownErrorToast) {
      toast.error('Koneksi realtime bermasalah', {
        description: realtime.error,
        duration: 5000,
        action: {
          label: 'Coba Lagi',
          onClick: () => {
            realtime.reconnect()
            setHasShownErrorToast(false)
          }
        }
      })
      setHasShownErrorToast(true)
    }
  }, [realtime.isConnected, realtime.error, hasShownConnectedToast, hasShownErrorToast, showToasts, realtime.reconnect])

  // Reset toast flags ketika reconnecting
  useEffect(() => {
    if (realtime.isConnecting) {
      setHasShownConnectedToast(false)
      setHasShownErrorToast(false)
    }
  }, [realtime.isConnecting])

  return (
    <RealtimeCasinoContext.Provider value={realtime}>
      {children}
    </RealtimeCasinoContext.Provider>
  )
}

// Hook untuk menggunakan realtime casino context
export function useRealtimeCasinoContext() {
  const context = useContext(RealtimeCasinoContext)
  
  if (!context) {
    throw new Error('useRealtimeCasinoContext must be used within RealtimeCasinoProvider')
  }
  
  return context
}

// Hook untuk status realtime (optional, untuk komponen yang hanya perlu status)
export function useRealtimeCasinoStatus() {
  const context = useContext(RealtimeCasinoContext)
  
  return {
    isConnected: context?.isConnected ?? false,
    isConnecting: context?.isConnecting ?? false,
    error: context?.error ?? null,
    lastUpdate: context?.lastUpdate ?? 0
  }
}