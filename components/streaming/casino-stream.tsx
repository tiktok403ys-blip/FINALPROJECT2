"use client"

import { Suspense, useState, useEffect, useCallback } from 'react'
import { CasinoCardMobileFirst } from '@/components/casino-card-mobile-first'
import { CasinoCardSkeleton } from '@/components/casino-card-mobile-first'
import { useCasinoMobileOptimization } from '@/hooks/use-casino-mobile-optimization'
import { useCasinoStore } from '@/lib/store/casino-store'
import type { Casino } from '@/lib/types'

// Streaming component for individual casino
async function CasinoStream({ casino }: { casino: Casino }) {
  // Simulate streaming delay for demonstration
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

  return <CasinoCardMobileFirst casino={casino} rank={0} />
}

// Progressive loading manager
function ProgressiveLoader({
  casinos,
  chunkSize = 4
}: {
  casinos: Casino[]
  chunkSize?: number
}) {
  const [loadedChunks, setLoadedChunks] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const chunks = []
  for (let i = 0; i < casinos.length; i += chunkSize) {
    chunks.push(casinos.slice(i, i + chunkSize))
  }

  const visibleChunks = chunks.slice(0, loadedChunks)
  const hasMore = loadedChunks < chunks.length

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setTimeout(() => {
      setLoadedChunks(prev => prev + 1)
      setIsLoading(false)
    }, 500) // Simulate loading time
  }, [isLoading, hasMore])

  // Auto-load on scroll for mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !hasMore) return

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMore()
      }
    }

    const throttledScroll = (() => {
      let timeoutId: NodeJS.Timeout | null = null
      return () => {
        if (timeoutId) return
        timeoutId = setTimeout(() => {
          handleScroll()
          timeoutId = null
        }, 100)
      }
    })()

    window.addEventListener('scroll', throttledScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (throttledScroll) clearTimeout(throttledScroll as any)
    }
  }, [hasMore, loadMore])

  return (
    <div className="space-y-6">
      {/* Render visible chunks with streaming */}
      {visibleChunks.map((chunk, chunkIndex) => (
        <div key={chunkIndex} className="space-y-6">
          {chunk.map((casino, casinoIndex) => {
            const globalIndex = chunkIndex * chunkSize + casinoIndex

            return (
              <Suspense
                key={casino.id}
                fallback={<CasinoCardSkeleton />}
              >
                <CasinoStream casino={casino} />
              </Suspense>
            )
          })}
        </div>
      ))}

      {/* Loading indicator for next chunk */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading more casinos...</span>
          </div>
        </div>
      )}

      {/* Load more button for desktop */}
      {hasMore && (
        <div className="hidden md:flex justify-center py-8">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-3 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-lg text-[#00ff88] font-medium transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More Casinos'}
          </button>
        </div>
      )}
    </div>
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

  // Set initial casinos in store
  useEffect(() => {
    if (initialCasinos.length > 0) {
      setCasinos(initialCasinos)
    }
  }, [initialCasinos, setCasinos])

  // Use the mobile optimization hook
  const {
    visibleCasinos,
    hasMore,
    isLoadingMore,
    loadMore
  } = useCasinoMobileOptimization(initialCasinos, 'all')

  if (enableStreaming && initialCasinos.length > 0) {
    return (
      <ProgressiveLoader
        casinos={initialCasinos}
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
  }, [casino.id, hasError])

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
