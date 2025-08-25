// Hook untuk Supabase Realtime integration dengan casino store
// Mengoptimalkan untuk mobile dengan debouncing dan batching updates

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCasinoStore } from '@/lib/store/casino-store'
import type { Casino } from '@/lib/types'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RealtimeState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastUpdate: number
  reconnectAttempts: number
  circuitBreakerOpen: boolean
  lastFailureTime: number
}

interface UseCasinoRealtimeOptions {
  enabled?: boolean
  debounceMs?: number
  maxReconnectAttempts?: number
  batchSize?: number
}

const DEFAULT_OPTIONS: Required<UseCasinoRealtimeOptions> = {
  enabled: true,
  debounceMs: 300,
  maxReconnectAttempts: 3,
  batchSize: 10
}

// Circuit breaker constants
const CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minute
const MAX_CONSECUTIVE_FAILURES = 3
const INITIAL_RETRY_DELAY = 2000 // 2 seconds
const MAX_RETRY_DELAY = 30000 // 30 seconds

export function useCasinoRealtime(options: UseCasinoRealtimeOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { state, actions } = useCasinoStore()
  const supabase = createClient()
  
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: 0,
    reconnectAttempts: 0,
    circuitBreakerOpen: false,
    lastFailureTime: 0
  })

  const channelRef = useRef<RealtimeChannel | null>(null)
  const updateQueueRef = useRef<Casino[]>([])
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Batch update function dengan debouncing
  const processBatchedUpdates = useCallback(() => {
    if (updateQueueRef.current.length === 0) return

    const updates = [...updateQueueRef.current]
    updateQueueRef.current = []

    // Update casino store dengan batch updates
    const currentCasinos = state.casinos
    const updatedCasinos = [...currentCasinos]

    updates.forEach(updatedCasino => {
      const index = updatedCasinos.findIndex(c => c.id === updatedCasino.id)
      if (index >= 0) {
        updatedCasinos[index] = updatedCasino
      } else {
        // Casino baru, tambahkan ke awal list
        updatedCasinos.unshift(updatedCasino)
      }
    })

    actions.setCasinos(updatedCasinos)
    actions.setLoading('realtime', false)
    
    setRealtimeState(prev => ({
      ...prev,
      lastUpdate: Date.now(),
      error: null
    }))
  }, [state.casinos, actions])

  // Debounced update function
  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      processBatchedUpdates()
    }, opts.debounceMs)
  }, [processBatchedUpdates, opts.debounceMs])

  // Handle realtime changes
  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<Casino>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        if (newRecord) {
          // Tambahkan ke queue untuk batch processing
          updateQueueRef.current.push(newRecord)
          
          // Trigger debounced update jika queue sudah mencapai batch size
          if (updateQueueRef.current.length >= opts.batchSize) {
            processBatchedUpdates()
          } else {
            debouncedUpdate()
          }
        }
        break
        
      case 'DELETE':
        if (oldRecord) {
          // Handle delete immediately (tidak perlu debounce)
          const currentCasinos = state.casinos
          const filteredCasinos = currentCasinos.filter(c => c.id !== oldRecord.id)
          actions.setCasinos(filteredCasinos)
        }
        break
    }
  }, [state.casinos, actions, opts.batchSize, processBatchedUpdates, debouncedUpdate])

  // Circuit breaker check
  const isCircuitBreakerOpen = useCallback(() => {
    const now = Date.now()
    return realtimeState.circuitBreakerOpen && 
           (now - realtimeState.lastFailureTime) < CIRCUIT_BREAKER_TIMEOUT
  }, [realtimeState.circuitBreakerOpen, realtimeState.lastFailureTime])

  // Reset circuit breaker
  const resetCircuitBreaker = useCallback(() => {
    setRealtimeState(prev => ({
      ...prev,
      circuitBreakerOpen: false,
      reconnectAttempts: 0,
      error: null
    }))
  }, [])

  // Reconnection logic with circuit breaker
  const attemptReconnect = useCallback(() => {
    // Check if circuit breaker is open
    if (isCircuitBreakerOpen()) {
      console.warn('Circuit breaker is open, skipping reconnection attempt')
      return
    }

    // Check max attempts
    if (realtimeState.reconnectAttempts >= opts.maxReconnectAttempts) {
      setRealtimeState(prev => ({
        ...prev,
        error: `Realtime connection failed after ${opts.maxReconnectAttempts} attempts`,
        isConnecting: false,
        circuitBreakerOpen: true,
        lastFailureTime: Date.now()
      }))
      console.warn('Opening circuit breaker due to consecutive failures')
      return
    }

    // Calculate exponential backoff delay
    const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, realtimeState.reconnectAttempts)
    const delay = Math.min(baseDelay, MAX_RETRY_DELAY)
    
    console.log(`Attempting reconnection in ${delay}ms (attempt ${realtimeState.reconnectAttempts + 1}/${opts.maxReconnectAttempts})`)
    
    reconnectTimerRef.current = setTimeout(() => {
      setRealtimeState(prev => ({
        ...prev,
        isConnecting: true,
        reconnectAttempts: prev.reconnectAttempts + 1
      }))
      
      // Cleanup existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      
      // Create new channel
      setupRealtimeChannel()
    }, delay)
  }, [realtimeState.reconnectAttempts, realtimeState.circuitBreakerOpen, realtimeState.lastFailureTime, opts.maxReconnectAttempts, supabase, isCircuitBreakerOpen])

  // Setup realtime channel
  const setupRealtimeChannel = useCallback(() => {
    if (!opts.enabled) return

    setRealtimeState(prev => ({ ...prev, isConnecting: true, error: null }))
    actions.setLoading('realtime', true)

    const channel = supabase
      .channel('casinos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'casinos'
        },
        handleRealtimeChange
      )
      .subscribe((status: string) => {
        // Only log important status changes, not every status update
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connection established')
        } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          console.warn(`⚠️ Realtime connection ${status.toLowerCase()}`)
        }
        
        switch (status) {
          case 'SUBSCRIBED':
            setRealtimeState(prev => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              error: null,
              reconnectAttempts: 0,
              circuitBreakerOpen: false,
              lastFailureTime: 0
            }))
            actions.setLoading('realtime', false)
            break
            
          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
          case 'CLOSED':
            setRealtimeState(prev => ({
              ...prev,
              isConnected: false,
              isConnecting: false,
              error: `Realtime connection ${status.toLowerCase()}`,
              lastFailureTime: Date.now()
            }))
            actions.setLoading('realtime', false)
            actions.setError('realtime', `Realtime connection ${status.toLowerCase()}`)
            
            // Only attempt reconnection if not already trying and circuit breaker is closed
            if (!realtimeState.isConnecting && !isCircuitBreakerOpen()) {
              attemptReconnect()
            }
            break
        }
      })

    channelRef.current = channel
  }, [opts.enabled, supabase, handleRealtimeChange, actions, attemptReconnect, realtimeState.isConnecting, isCircuitBreakerOpen])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection initiated')
    
    // Reset circuit breaker and state
    setRealtimeState(prev => ({
      ...prev,
      reconnectAttempts: 0,
      error: null,
      circuitBreakerOpen: false,
      lastFailureTime: 0,
      isConnecting: false
    }))
    
    // Clear any existing timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    
    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    // Setup new channel
    setupRealtimeChannel()
  }, [supabase, setupRealtimeChannel])

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting realtime connection')
    
    // Clear any existing timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    
    // Remove channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    // Reset state with all required properties
    setRealtimeState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastUpdate: 0,
      reconnectAttempts: 0,
      circuitBreakerOpen: false,
      lastFailureTime: 0
    })
    
    actions.setLoading('realtime', false)
    actions.setError('realtime', null)
  }, [supabase, actions])

  // Setup effect
  useEffect(() => {
    setupRealtimeChannel()
    
    return () => {
      // Cleanup
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      
      // Process any remaining updates
      if (updateQueueRef.current.length > 0) {
        processBatchedUpdates()
      }
    }
  }, [setupRealtimeChannel, supabase, processBatchedUpdates])

  // Visibility change handler untuk pause/resume realtime
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause realtime ketika tab tidak aktif
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }
      } else {
        // Resume realtime ketika tab aktif kembali
        if (opts.enabled && !channelRef.current) {
          setupRealtimeChannel()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [opts.enabled, setupRealtimeChannel, supabase])

  // Fallback mechanism - disable realtime if circuit breaker is open for too long
  const isRealtimeAvailable = useCallback(() => {
    return opts.enabled && !isCircuitBreakerOpen()
  }, [opts.enabled, isCircuitBreakerOpen])

  return {
    // State
    isConnected: realtimeState.isConnected,
    isConnecting: realtimeState.isConnecting,
    error: realtimeState.error,
    lastUpdate: realtimeState.lastUpdate,
    reconnectAttempts: realtimeState.reconnectAttempts,
    circuitBreakerOpen: realtimeState.circuitBreakerOpen,
    isRealtimeAvailable: isRealtimeAvailable(),
    
    // Actions
    reconnect,
    disconnect,
    resetCircuitBreaker,
    
    // Queue info untuk debugging
    queueSize: updateQueueRef.current.length
  }
}

// Hook untuk casino realtime dengan auto-fetch initial data
export function useCasinoRealtimeWithData(options: UseCasinoRealtimeOptions = {}) {
  const realtime = useCasinoRealtime(options)
  const { state, actions } = useCasinoStore()
  const [initialLoading, setInitialLoading] = useState(true)

  // Fetch initial data jika belum ada
  useEffect(() => {
    const fetchInitialData = async () => {
      if (state.casinos.length > 0) {
        setInitialLoading(false)
        return
      }

      try {
        actions.setLoading('initial', true)
        
        const supabase = createClient()
        const { data: casinos, error } = await supabase
          .from('casinos')
          .select('*')
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(50) // Load first 50 casinos

        if (error) {
          throw error
        }

        actions.setCasinos(casinos || [])
        actions.setError('initial', null)
      } catch (error) {
        console.error('Error fetching initial casino data:', error)
        actions.setError('initial', error instanceof Error ? error.message : 'Unknown error')
      } finally {
        actions.setLoading('initial', false)
        setInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [state.casinos.length, actions])

  return {
    ...realtime,
    initialLoading,
    casinos: state.casinos,
    totalCasinos: state.casinos.length
  }
}