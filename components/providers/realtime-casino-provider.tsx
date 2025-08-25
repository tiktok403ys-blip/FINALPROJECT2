// Enhanced Provider for managing Supabase Realtime connection globally
// Optimized for public pages with advanced error handling and performance monitoring

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useCasinoRealtimeWithData } from '@/hooks/use-casino-realtime'
import { toast } from 'sonner'

interface RealtimeCasinoContextType {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastUpdate: number
  reconnectAttempts: number
  reconnect: () => void
  disconnect: () => void
  resetCircuitBreaker: () => void
  queueSize: number
  initialLoading: boolean
  // Enhanced features for public pages
  totalCasinos: number
  cacheTimestamp: number | null
  invalidateCache: () => void
  // CRUD helpers for admin operations
  createCasino: (data: any) => Promise<any>
  updateCasino: (id: string, data: any) => Promise<any>
  deleteCasino: (id: string) => Promise<any>
  // Performance metrics
  connectionUptime: number
  messagesReceived: number
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
  // Enhanced realtime configuration for public pages
  const realtime = useCasinoRealtimeWithData({
    enabled,
    debounceMs: 300,
    maxReconnectAttempts: 5,
    batchSize: 10,
    debug: false,
    enableSelectiveUpdates: true,
    enableCRUDOptimizations: true,
    retryOnFailure: true,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes
  })

  // Performance tracking
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(null)
  const [messagesReceived, setMessagesReceived] = useState(0)

  const [hasShownConnectedToast, setHasShownConnectedToast] = useState(false)
  const [hasShownErrorToast, setHasShownErrorToast] = useState(false)

  // Handle connection status changes with toast notifications
  useEffect(() => {
    if (!showToasts) return

    if (realtime.isConnected && !hasShownConnectedToast) {
      toast.success('Casino data realtime connected', {
        description: 'Casino data will be updated automatically',
        duration: 3000
      })
      setHasShownConnectedToast(true)
      setHasShownErrorToast(false)
    }

    if (realtime.error && !hasShownErrorToast) {
      toast.error('Realtime connection issue', {
        description: realtime.error,
        duration: 5000,
        action: {
          label: 'Try Again',
          onClick: () => {
            realtime.reconnect()
            setHasShownErrorToast(false)
          }
        }
      })
      setHasShownErrorToast(true)
    }
  }, [realtime.isConnected, realtime.error, hasShownConnectedToast, hasShownErrorToast, showToasts, realtime.reconnect])

  // Reset toast flags when reconnecting
  useEffect(() => {
    if (realtime.isConnecting) {
      setHasShownConnectedToast(false)
      setHasShownErrorToast(false)
    }
  }, [realtime.isConnecting])

  // Track connection uptime and message count
  useEffect(() => {
    if (realtime.isConnected && !connectionStartTime) {
      setConnectionStartTime(Date.now())
      setMessagesReceived(0)
    } else if (!realtime.isConnected && connectionStartTime) {
      setConnectionStartTime(null)
    }
  }, [realtime.isConnected, connectionStartTime])

  // Track messages received (increment on each update)
  useEffect(() => {
    if (realtime.lastUpdate > 0) {
      setMessagesReceived(prev => prev + 1)
    }
  }, [realtime.lastUpdate])

  return (
    <RealtimeCasinoContext.Provider value={{
      isConnected: realtime.isConnected,
      isConnecting: realtime.isConnecting,
      error: realtime.error,
      lastUpdate: realtime.lastUpdate,
      reconnectAttempts: realtime.reconnectAttempts,
      reconnect: realtime.reconnect,
      disconnect: realtime.disconnect,
      resetCircuitBreaker: realtime.resetCircuitBreaker,
      queueSize: realtime.queueSize,
      initialLoading: realtime.initialLoading,
      // Enhanced features
      totalCasinos: realtime.totalCasinos,
      cacheTimestamp: realtime.cacheTimestamp,
      invalidateCache: realtime.invalidateCache,
      // CRUD helpers
      createCasino: realtime.createCasino,
      updateCasino: realtime.updateCasino,
      deleteCasino: realtime.deleteCasino,
      // Performance metrics
      connectionUptime: connectionStartTime ? Date.now() - connectionStartTime : 0,
      messagesReceived
    }}>
      {children}
    </RealtimeCasinoContext.Provider>
  )
}

// Hook for using realtime casino context
export function useRealtimeCasinoContext() {
  const context = useContext(RealtimeCasinoContext)
  
  if (!context) {
    throw new Error('useRealtimeCasinoContext must be used within RealtimeCasinoProvider')
  }
  
  return context
}

// Hook for realtime status (optional, for components that only need status)
export function useRealtimeCasinoStatus() {
  const context = useContext(RealtimeCasinoContext)
  
  return {
    isConnected: context?.isConnected ?? false,
    isConnecting: context?.isConnecting ?? false,
    error: context?.error ?? null,
    lastUpdate: context?.lastUpdate ?? 0,
    initialLoading: context?.initialLoading ?? false
  }
}