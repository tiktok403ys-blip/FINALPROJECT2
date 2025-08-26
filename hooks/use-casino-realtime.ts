// Enhanced Unified Casino Realtime Hook
// Optimized for public pages with selective updates and CRUD operations

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCasinoStore } from '@/lib/store/casino-store'
import type { Casino } from '@/lib/types'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

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
  debug?: boolean
  enableSelectiveUpdates?: boolean
  enableCRUDOptimizations?: boolean
  retryOnFailure?: boolean
  cacheTimeout?: number
}

const DEFAULT_OPTIONS: Required<UseCasinoRealtimeOptions> = {
  enabled: true,
  debounceMs: 300,
  maxReconnectAttempts: 5,
  batchSize: 10,
  debug: process.env.NODE_ENV !== 'production',
  enableSelectiveUpdates: true,
  enableCRUDOptimizations: true,
  retryOnFailure: true,
  cacheTimeout: 5 * 60 * 1000 // 5 minutes
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

  // Enhanced realtime change handler with selective updates
  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<Casino>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          if (opts.enableSelectiveUpdates) {
            // Selective update: Add new casino to the beginning if it doesn't exist
            const currentCasinos = state.casinos
            const exists = currentCasinos.some(c => c.id === newRecord.id)

            if (!exists) {
              actions.setCasinos([newRecord, ...currentCasinos])
              setRealtimeState(prev => ({
                ...prev,
                lastUpdate: Date.now()
              }))

              if (opts.debug) {
                logger.log('✅ New casino added via realtime:', { metadata: { casinoName: newRecord.name } })
              }
            }
          } else {
            // Legacy batch processing
            updateQueueRef.current.push(newRecord)
            if (updateQueueRef.current.length >= opts.batchSize) {
              processBatchedUpdates()
            } else {
              debouncedUpdate()
            }
          }
        }
        break

      case 'UPDATE':
        if (newRecord) {
          if (opts.enableSelectiveUpdates) {
            // Selective update: Replace specific casino
            const currentCasinos = state.casinos
            const index = currentCasinos.findIndex(c => c.id === newRecord.id)

            if (index >= 0) {
              const updatedCasinos = [...currentCasinos]
              updatedCasinos[index] = newRecord
              actions.setCasinos(updatedCasinos)

              setRealtimeState(prev => ({
                ...prev,
                lastUpdate: Date.now()
              }))

              if (opts.debug) {
                logger.log('🔄 Casino updated via realtime:', { metadata: { casinoName: newRecord.name } })
              }
            }
          } else {
            // Legacy batch processing
            updateQueueRef.current.push(newRecord)
            if (updateQueueRef.current.length >= opts.batchSize) {
              processBatchedUpdates()
            } else {
              debouncedUpdate()
            }
          }
        }
        break

      case 'DELETE':
        if (oldRecord) {
          // Immediate delete for better UX
          const currentCasinos = state.casinos
          const filteredCasinos = currentCasinos.filter(c => c.id !== oldRecord.id)
          actions.setCasinos(filteredCasinos)

          setRealtimeState(prev => ({
            ...prev,
            lastUpdate: Date.now()
          }))

          if (opts.debug) {
            logger.log('🗑️ Casino deleted via realtime:', { metadata: { casinoName: oldRecord.name } })
          }
        }
        break
    }
  }, [state.casinos, actions, opts.batchSize, opts.enableSelectiveUpdates, opts.debug, processBatchedUpdates, debouncedUpdate])

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
      // Only log circuit breaker status occasionally to reduce spam
      if (opts.debug && realtimeState.reconnectAttempts === 0) {
        logger.warn('⚡ Circuit breaker active, reconnection paused')
      }
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
      if (opts.debug) logger.warn('⚡ Circuit breaker activated after max attempts')
      return
    }

    // Calculate exponential backoff delay
    const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, realtimeState.reconnectAttempts)
    const delay = Math.min(baseDelay, MAX_RETRY_DELAY)
    
    // Only log on first attempt or every 3rd attempt to reduce console spam
    if (opts.debug && (realtimeState.reconnectAttempts === 0 || realtimeState.reconnectAttempts % 3 === 0)) {
      logger.log(`🔄 Reconnecting... (attempt ${realtimeState.reconnectAttempts + 1}/${opts.maxReconnectAttempts})`)
    }
    
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
        if (opts.debug && status === 'SUBSCRIBED') {
          logger.log('✅ Realtime connection established')
        } else if (opts.debug && ['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) {
          logger.warn(`⚠️ Realtime connection ${status.toLowerCase()}`)
        } else if (opts.debug && status === 'CLOSED' && realtimeState.isConnected) {
          // Only log CLOSED status if we were previously connected (to avoid spam)
          logger.warn('⚠️ Realtime connection closed')
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
  }, [opts.enabled, supabase, handleRealtimeChange, actions, attemptReconnect, isCircuitBreakerOpen, opts.debug, realtimeState.isConnected])

  // Manual reconnect function
  const reconnect = useCallback(() => {
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
    
    // Reset state dengan semua properti yang dibutuhkan
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

// Enhanced hook for casino realtime with auto-fetch initial data and CRUD optimizations
export function useCasinoRealtimeWithData(options: UseCasinoRealtimeOptions = {}) {
  const realtime = useCasinoRealtime(options)
  const { state, actions } = useCasinoStore()
  const [initialLoading, setInitialLoading] = useState(true)
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null)

  // Fetch initial data dengan caching strategy
  useEffect(() => {
    const fetchInitialData = async () => {
      const now = Date.now()
      const cacheValid = cacheTimestamp && (now - cacheTimestamp) < options.cacheTimeout!

      // Use cached data if available and valid
      if (state.casinos.length > 0 && cacheValid && options.enableCRUDOptimizations) {
        setInitialLoading(false)
        if (options.debug) {
          logger.log('📦 Using cached casino data, skipping fetch')
        }
        return
      }

      try {
        actions.setLoading('initial', true)

        const supabase = createClient()
        const { data: casinos, error } = await supabase
          .from('casinos')
          .select('*')
          .eq('is_active', true) // Only fetch active casinos for public
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(100) // Load more casinos for better UX

        if (error) {
          throw error
        }

        actions.setCasinos(casinos || [])
        actions.setError('initial', null)
        setCacheTimestamp(now)

        if (options.debug) {
          logger.log(`📥 Fetched ${casinos?.length || 0} casinos from server`)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          logger.error('Error fetching initial casino data:', error as Error)
        }
        actions.setError('initial', error instanceof Error ? error.message : 'Unknown error')

        // Retry logic for failed requests
        if (options.retryOnFailure && state.casinos.length === 0) {
          setTimeout(() => {
            if (options.debug) {
              logger.log('🔄 Retrying initial data fetch...')
            }
            fetchInitialData()
          }, 3000)
        }
      } finally {
        actions.setLoading('initial', false)
        setInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [state.casinos.length, actions, cacheTimestamp, options])

  // CRUD operation helpers for optimistic updates
  const createCasino = useCallback(async (casinoData: Partial<Casino>) => {
    if (!options.enableCRUDOptimizations) return null

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('casinos')
        .insert(casinoData)
        .select()
        .single()

      if (error) throw error

      // Optimistic update will be handled by realtime subscription
      return data
    } catch (error) {
      logger.error('Error creating casino:', error as Error)
      throw error
    }
  }, [options.enableCRUDOptimizations])

  const updateCasino = useCallback(async (id: string, updates: Partial<Casino>) => {
    if (!options.enableCRUDOptimizations) return null

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('casinos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Optimistic update will be handled by realtime subscription
      return data
    } catch (error) {
      logger.error('Error updating casino:', error as Error)
      throw error
    }
  }, [options.enableCRUDOptimizations])

  const deleteCasino = useCallback(async (id: string) => {
    if (!options.enableCRUDOptimizations) return null

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('casinos')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Optimistic update will be handled by realtime subscription
      return true
    } catch (error) {
      logger.error('Error deleting casino:', error as Error)
      throw error
    }
  }, [options.enableCRUDOptimizations])

  return {
    ...realtime,
    initialLoading,
    casinos: state.casinos,
    totalCasinos: state.casinos.length,
    // CRUD helpers for admin operations
    createCasino,
    updateCasino,
    deleteCasino,
    // Cache info
    cacheTimestamp,
    invalidateCache: () => setCacheTimestamp(null)
  }
}