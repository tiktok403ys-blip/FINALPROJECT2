'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { Casino } from '@/lib/types'
import { CasinoCardMobileFirst, CasinoCardSkeleton } from '@/components/casino-card-mobile-first'

import { useCasinoStore } from '@/lib/store/casino-store'
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
  const { state: { casinos: storeCasinos } } = useCasinoStore()
  const { isConnected, initialLoading, error } = useRealtimeCasinoStatus()
  
  // Gunakan data dari store (diisi oleh Provider). Fallback ke initial data dari server.
  const activeCasinos = storeCasinos.length > 0 
    ? storeCasinos 
    : initialCasinos

  // Simple pagination state
  const [visibleCount, setVisibleCount] = useState(8)
  const visibleCasinos = activeCasinos.slice(0, visibleCount)
  const hasMore = visibleCount < activeCasinos.length
  const isLoadingMore = false
  
  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 4, activeCasinos.length))
  }

  // Show loading state ketika initial load dari provider masih berjalan
  if (initialLoading && activeCasinos.length === 0) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CasinoCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Show error state jika ada error realtime dan belum ada data
  if (error && activeCasinos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-red-400 mb-4">⚠️ Error loading casino data</div>
        <p className="text-gray-400">{error}</p>
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

// Enhanced Streaming wrapper with error boundaries
export function StreamingWrapper({
  children,
  fallback
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <Suspense fallback={fallback || <CasinoCardSkeleton />}>
      <CasinoErrorBoundary>
        {children}
      </CasinoErrorBoundary>
    </Suspense>
  )
}

// Error boundary for streaming components
export function CasinoErrorBoundary({
  children,
  fallback
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Casino streaming error:', event.error)
      setHasError(true)
      setError(event.error)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return fallback || (
      <div className="text-center py-8 text-red-400">
        <p>⚠️ Error loading casino data</p>
        <button
          onClick={() => {
            setHasError(false)
            setError(null)
            window.location.reload()
          }}
          className="mt-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return <>{children}</>
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
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'streaming_performance', {
        event_category: 'Performance',
        event_label: 'component_stream',
        value: Math.round(loadTime),
        custom_parameter_1: success ? 'success' : 'failed',
        custom_parameter_2: (context as any).componentName || 'unknown'
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
  }, [casino.id, hasError, trackStreamEnd, trackStreamStart])

  return (
    <Suspense fallback={<CasinoCardSkeleton />}>
      <CasinoCardMobileFirst
        casino={casino}
        rank={0}
      />
    </Suspense>
  )
}