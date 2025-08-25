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
  maxReconnectAttempts: 5,
  batchSize: 10
}

export function useCasinoRealtime(options: UseCasinoRealtimeOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { state, actions } = useCasinoStore()
  const supabase = createClient()
  
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: 0,
    reconnectAttempts: 0
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

  // Reconnection logic
  const attemptReconnect = useCallback(() => {
    if (realtimeState.reconnectAttempts >= opts.maxReconnectAttempts) {
      setRealtimeState(prev => ({
        ...prev,
        error: `Maksimum ${opts.maxReconnectAttempts} percobaan reconnect tercapai`,
        isConnecting: false
      }))
      return
    }

    const delay = Math.min(1000 * Math.pow(2, realtimeState.reconnectAttempts), 30000)
    
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
  }, [realtimeState.reconnectAttempts, opts.maxReconnectAttempts, supabase])

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
        console.log('Casino realtime status:', status)
        
        switch (status) {
          case 'SUBSCRIBED':
            setRealtimeState(prev => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              error: null,
              reconnectAttempts: 0
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
              error: `Koneksi realtime error: ${status}`
            }))
            actions.setLoading('realtime', false)
            actions.setError('realtime', `Koneksi realtime error: ${status}`)
            
            // Attempt reconnection
            attemptReconnect()
            break
        }
      })

    channelRef.current = channel
  }, [opts.enabled, supabase, handleRealtimeChange, actions, attemptReconnect])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setRealtimeState(prev => ({
      ...prev,
      reconnectAttempts: 0,
      error: null
    }))
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
    
    setupRealtimeChannel()
  }, [supabase, setupRealtimeChannel])

  // Disconnect function
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    setRealtimeState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastUpdate: 0,
      reconnectAttempts: 0
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

  return {
    // State
    isConnected: realtimeState.isConnected,
    isConnecting: realtimeState.isConnecting,
    error: realtimeState.error,
    lastUpdate: realtimeState.lastUpdate,
    reconnectAttempts: realtimeState.reconnectAttempts,
    
    // Actions
    reconnect,
    disconnect,
    
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