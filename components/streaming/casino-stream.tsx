'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { Casino } from '@/lib/types'
import { CasinoCardMobileFirst, CasinoCardSkeleton } from '@/components/casino-card-mobile-first'
import { useCasinoMobileOptimization } from '@/hooks/use-casino-mobile-optimization'
import { useCasinoStore } from '@/lib/store/casino-store'
import { useCasinoRealtimeWithData } from '@/hooks/use-casino-realtime'
import { useRealtimeCasinoStatus } from '@/components/providers/realtime-casino-provider'

// Progressive loader for chunked casino loading
export function ProgressiveLoader({
  casinos,
  chunkSize = 4,
  delay = 100
}: {
  casinos: Casino[]
  chunkSize?: number
  delay?: number
}) {
  const [visibleCount, setVisibleCount] = useState(chunkSize)
  const [isLoading, setIsLoading] = useState(false)

  const loadMore = async () => {
    if (isLoading || visibleCount >= casinos.length) return
    
    setIsLoading(true)
    
    // Simulate network delay for progressive loading
    await new Promise(resolve => setTimeout(resolve, delay))
    
    setVisibleCount(prev => Math.min(prev + chunkSize, casinos.length))
    setIsLoading(false)
  }

  const visibleCasinos = casinos.slice(0, visibleCount)
  const hasMore = visibleCount < casinos.length

  return (
    <div className="space-y-6">
      {visibleCasinos.map((casino, index) => (
        <CasinoStream key={casino.id} casino={casino} rank={index + 1} />
      ))}
      
      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-3 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-lg text-[#00ff88] font-medium transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

// Individual casino stream component
export function CasinoStream({ 
  casino, 
  rank 
}: { 
  casino: Casino
  rank?: number 
}) {
  return (
    <Suspense fallback={<CasinoCardSkeleton />}>
      <CasinoCardMobileFirst
        casino={casino}
        rank={rank || 0}
      />
    </Suspense>
  )
}

// Main streaming casino grid component
export function StreamingCasinoGrid({
  initialCasinos = [],
  enableStreaming = true,
  enableProgressiveLoading = true
}: {
  initialCasinos?: Casino[]
  enableStreaming?: boolean
  enableProgressiveLoading?: boolean
}) {
  const { actions: { setCasinos } } = useCasinoStore()
  const { isConnected } = useRealtimeCasinoStatus()
  
  // Use realtime hook untuk data yang selalu update
  const { 
    casinos: realtimeCasinos, 
    initialLoading: isRealtimeLoading,
    error: realtimeError 
  } = useCasinoRealtimeWithData({
    enabled: true
  })

  // Gunakan realtime data jika tersedia, fallback ke initial data
  const activeCasinos = isConnected && realtimeCasinos.length > 0 
    ? realtimeCasinos 
    : initialCasinos

  // Set casinos in store
  useEffect(() => {
    if (activeCasinos.length > 0) {
      setCasinos(activeCasinos)
    }
  }, [activeCasinos, setCasinos])

  // Use the mobile optimization hook
  const {
    visibleCasinos,
    hasMore,
    isLoadingMore,
    loadMore
  } = useCasinoMobileOptimization(activeCasinos, 'all')

  // Show loading state untuk realtime data
  if (isRealtimeLoading && activeCasinos.length === 0) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CasinoCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Show error state jika ada error realtime
  if (realtimeError && activeCasinos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-red-400 mb-4">⚠️ Error loading casino data</div>
        <p className="text-gray-400">{realtimeError}</p>
      </div>
    )
  }

  if (enableStreaming && activeCasinos.length > 0) {
    return (
      <ProgressiveLoader
        casinos={activeCasinos}
        chunkSize={4}
      />
    )
  }

  // Fallback to regular rendering
  return (
    <div className="space-y-6">
      {visibleCasinos.map((casino, index) => (
        <CasinoCardMobileFirst
          key={casino.id}
          casino={casino}
          rank={index + 1}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-lg text-[#00ff88] font-medium transition-all duration-200 disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

// Streaming wrapper for server components
export function StreamingWrapper({
  children,
  fallback
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <Suspense fallback={fallback || <CasinoCardSkeleton />}>
      {children}
    </Suspense>
  )
}

// Performance monitoring for streaming
export function useStreamingMetrics() {
  const [metrics, setMetrics] = useState({
    streamedComponents: 0,
    averageLoadTime: 0,
    failedStreams: 0,
    totalStreamTime: 0
  })

  const trackStreamStart = () => {
    const startTime = performance.now()
    return { startTime }
  }

  const trackStreamEnd = (context: any, success: boolean) => {
    const endTime = performance.now()
    const loadTime = endTime - context.startTime

    setMetrics(prev => ({
      streamedComponents: prev.streamedComponents + 1,
      totalStreamTime: prev.totalStreamTime + loadTime,
      averageLoadTime: (prev.totalStreamTime + loadTime) / (prev.streamedComponents + 1),
      failedStreams: success ? prev.failedStreams : prev.failedStreams + 1
    }))

    // Track in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'streaming_performance', {
        event_category: 'Performance',
        event_label: 'component_stream',
        value: Math.round(loadTime),
        custom_parameter_1: success ? 'success' : 'failed',
        custom_parameter_2: context.componentName || 'unknown'
      })
    }
  }

  return {
    metrics,
    trackStreamStart,
    trackStreamEnd
  }
}

// Enhanced streaming component with error handling
export function StreamingCasinoWithErrorBoundary({
  casino,
  onError
}: {
  casino: Casino
  onError?: (error: Error) => void
}) {
  const [hasError, setHasError] = useState(false)
  const { trackStreamStart, trackStreamEnd } = useStreamingMetrics()

  useEffect(() => {
    const context = { ...trackStreamStart(), componentName: `casino-${casino.id}` }

    return () => {
      trackStreamEnd(context, !hasError)
    }
  }, [casino.id, hasError, trackStreamStart, trackStreamEnd])

  if (hasError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400 text-sm">Failed to load casino: {casino.name}</p>
        <button
          onClick={() => setHasError(false)}
          className="mt-2 text-xs text-red-300 hover:text-red-200"
        >
          Try again
        </button>
      </div>
    )
  }

  try {
    return <CasinoStream casino={casino} />
  } catch (error) {
    console.error(`Error streaming casino ${casino.id}:`, error)
    setHasError(true)
    onError?.(error as Error)
    return null
  }
}