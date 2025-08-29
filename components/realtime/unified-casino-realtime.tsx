// Unified Casino Realtime Component for Public Pages
// Optimized for performance with selective updates and CRUD operations

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRealtimeCasinoContext } from '@/components/providers/realtime-casino-provider'
import { StreamingCasinoGrid } from '@/components/streaming/casino-stream'
import { RealtimeConnectionStatus } from '@/components/realtime-connection-status'
import { Casino } from '@/lib/types'
import { toast } from 'sonner'

interface UnifiedCasinoRealtimeProps {
  initialCasinos?: Casino[]
  enableStreaming?: boolean
  enableProgressiveLoading?: boolean
  showConnectionStatus?: boolean
  onCasinoUpdate?: (casino: Casino, action: 'insert' | 'update' | 'delete') => void
  filterOptions?: {
    category?: string
    minRating?: number
    sortBy?: 'rating' | 'name' | 'newest'
  }
  isGridView?: boolean
}

export function UnifiedCasinoRealtime({
  initialCasinos = [],
  enableStreaming = true,
  enableProgressiveLoading = true,
  showConnectionStatus = false,
  onCasinoUpdate,
  filterOptions,
  isGridView = false
}: UnifiedCasinoRealtimeProps) {
  const {
    isConnected,
    isConnecting,
    error,
    lastUpdate,
    totalCasinos,
    cacheTimestamp,
    invalidateCache,
    connectionUptime,
    messagesReceived
  } = useRealtimeCasinoContext()

  const [filteredCasinos, setFilteredCasinos] = useState<Casino[]>(initialCasinos)
  const [lastAction, setLastAction] = useState<{
    type: 'insert' | 'update' | 'delete'
    casino: Casino
    timestamp: number
  } | null>(null)

  // Filter and sort casinos based on options
  const applyFilters = useCallback((casinos: Casino[]) => {
    let filtered = [...casinos]

    // Apply filters
    if (filterOptions?.category) {
      filtered = filtered.filter(casino =>
        casino.name.toLowerCase().includes(filterOptions.category!.toLowerCase()) ||
        casino.description?.toLowerCase().includes(filterOptions.category!.toLowerCase())
      )
    }

    if (filterOptions?.minRating) {
      filtered = filtered.filter(casino =>
        casino.rating && casino.rating >= filterOptions.minRating!
      )
    }

    // Apply sorting
    switch (filterOptions?.sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
        filtered.sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
        break
      default:
        // Default: display_order then rating
        filtered.sort((a, b) => {
          if (a.display_order && b.display_order) {
            return a.display_order - b.display_order
          }
          return (b.rating || 0) - (a.rating || 0)
        })
    }

    return filtered
  }, [filterOptions])

  // Update filtered casinos when initial data or filters change
  useEffect(() => {
    const filtered = applyFilters(initialCasinos)
    setFilteredCasinos(filtered)
  }, [initialCasinos, applyFilters])

  // Handle realtime updates with selective filtering
  useEffect(() => {
    if (!enableStreaming || lastUpdate === 0) return

    // Re-filter casinos when realtime updates occur
    const filtered = applyFilters(filteredCasinos)
    if (JSON.stringify(filtered) !== JSON.stringify(filteredCasinos)) {
      setFilteredCasinos(filtered)
    }

    // Show update notification for significant changes
    if (totalCasinos !== filteredCasinos.length) {
      const action = totalCasinos > filteredCasinos.length ? 'insert' : 'delete'
      toast.success(`Casino list updated (${totalCasinos} total)`, {
        description: `${action === 'insert' ? 'New casino added' : 'Casino removed'}`,
        duration: 3000
      })
    }
  }, [lastUpdate, totalCasinos, filteredCasinos.length, applyFilters, enableStreaming, filteredCasinos])

  // Handle connection status changes
  useEffect(() => {
    if (isConnected && !isConnecting) {
      toast.success('Live updates active', {
        description: 'Casino data will update automatically',
        duration: 2000
      })
    } else if (!isConnected && !isConnecting && error) {
      toast.error('Live updates disconnected', {
        description: 'Showing cached data',
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      })
    }
  }, [isConnected, isConnecting, error])

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    invalidateCache()
    toast.info('Refreshing casino data...', {
      description: 'Fetching latest updates'
    })
    // Force page refresh to get fresh server data
    window.location.reload()
  }, [invalidateCache])

  // Performance info for debugging
  const performanceInfo = {
    connectionUptime: Math.floor(connectionUptime / 1000), // seconds
    messagesReceived,
    cacheAge: cacheTimestamp ? Math.floor((Date.now() - cacheTimestamp) / 1000) : 0,
    filteredCount: filteredCasinos.length,
    totalCount: totalCasinos
  }

  return (
    <div className="space-y-6">
      {/* Connection Status - Optional */}
      {showConnectionStatus && (
        <RealtimeConnectionStatus
          showText={true}
          size="md"
          className="mb-4"
        />
      )}



      {/* Main Casino Grid */}
      <StreamingCasinoGrid
        initialCasinos={filteredCasinos}
        enableStreaming={enableStreaming}
        enableProgressiveLoading={enableProgressiveLoading}
        isGridView={isGridView}
      />

      {/* Last Update Info */}
      {lastUpdate > 0 && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          {lastAction && (
            <span className="ml-2 text-[#00ff88]">
              • {lastAction.type}: {lastAction.casino.name}
            </span>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredCasinos.length === 0 && !isConnecting && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎰</div>
          <h3 className="text-2xl font-bold text-white mb-4">No Casinos Found</h3>
          <p className="text-gray-400 text-lg mb-6">
            {filterOptions ? 'No casinos match your filters.' : 'We\'re working on adding more casinos.'}
          </p>
          {filterOptions && (
            <button
              onClick={() => window.location.href = '/casinos'}
              className="px-6 py-3 bg-[#00ff88]/20 hover:bg-[#00ff88]/30 border border-[#00ff88]/30 rounded-lg text-[#00ff88] font-medium transition-all duration-200"
            >
              View All Casinos
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Enhanced Realtime Status Component
interface EnhancedRealtimeStatusProps {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastUpdate: number
  onRefresh: () => void
  performanceInfo: {
    connectionUptime: number
    messagesReceived: number
    cacheAge: number
    filteredCount: number
    totalCount: number
  }
}

function EnhancedRealtimeStatus({
  isConnected,
  isConnecting,
  error,
  lastUpdate,
  onRefresh,
  performanceInfo
}: EnhancedRealtimeStatusProps) {
  return (
    <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse' :
            isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
          }`} />
          <span className="text-white font-medium">
            {isConnected ? 'Live Updates Active' :
             isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isConnecting}
          className="px-3 py-1 bg-[#00ff88]/20 hover:bg-[#00ff88]/30 border border-[#00ff88]/30 rounded text-[#00ff88] text-sm transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-2">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
        <div>
          <div className="text-white">{performanceInfo.connectionUptime}s</div>
          <div>Uptime</div>
        </div>
        <div>
          <div className="text-white">{performanceInfo.messagesReceived}</div>
          <div>Updates</div>
        </div>
        <div>
          <div className="text-white">{performanceInfo.filteredCount}/{performanceInfo.totalCount}</div>
          <div>Casinos</div>
        </div>
      </div>
    </div>
  )
}

export default UnifiedCasinoRealtime
