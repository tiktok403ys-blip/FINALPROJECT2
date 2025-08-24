"use client"

import { useEffect } from 'react'
import { initGA, useCoreWebVitals, usePerformanceObserver, analytics } from '@/lib/analytics'
import { useMobileFirst } from '@/hooks/use-mobile-first'

interface AnalyticsProviderProps {
  children: React.ReactNode
  measurementId?: string
}

export function AnalyticsProvider({ children, measurementId }: AnalyticsProviderProps) {
  const { isMobile, currentBreakpoint } = useMobileFirst()

  // Initialize Google Analytics
  useEffect(() => {
    if (measurementId) {
      // Initialize with custom measurement ID if provided
      initGA()
    }
  }, [measurementId])

  // Track Core Web Vitals
  useCoreWebVitals()

  // Track performance metrics
  usePerformanceObserver()

  // Track initial page load
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Track page view
    analytics.trackPageView(window.location.pathname)

    // Track device information
    analytics.trackMobileInteraction('page_load', {
      breakpoint: currentBreakpoint,
      is_mobile: isMobile,
      load_timestamp: Date.now()
    })

    // Track bundle load time (approximation)
    const navigationEntries = performance.getEntriesByType('navigation')
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming
      const bundleLoadTime = navEntry.loadEventEnd - navEntry.fetchStart

      // Track bundle load time as performance metric
      analytics.trackEvent({
        action: 'bundle_load',
        category: 'Performance',
        label: 'load_time',
        value: Math.round(bundleLoadTime)
      })
    }

    // Track memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory
      analytics.trackEvent({
        action: 'memory_usage',
        category: 'Performance',
        label: 'heap_size',
        value: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        customParameters: {
          total_heap: memory.totalJSHeapSize,
          heap_limit: memory.jsHeapSizeLimit
        }
      })
    }
  }, [isMobile, currentBreakpoint])

  // Track route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      analytics.trackPageView(url)
      analytics.trackMobileInteraction('route_change', {
        new_url: url,
        breakpoint: currentBreakpoint,
        timestamp: Date.now()
      })
    }

    // Listen for Next.js route changes
    if (typeof window !== 'undefined') {
      // Note: In Next.js 13+ App Router, we can listen to navigation events
      // This is a simplified version - you might want to enhance this
      const originalPushState = history.pushState
      history.pushState = function(state, title, url) {
        originalPushState.call(this, state, title, url)
        handleRouteChange(url?.toString() || window.location.href)
      }

      const originalReplaceState = history.replaceState
      history.replaceState = function(state, title, url) {
        originalReplaceState.call(this, state, title, url)
        handleRouteChange(url?.toString() || window.location.href)
      }
    }
  }, [currentBreakpoint])

  // Track visibility changes (tab switching)
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      analytics.trackMobileInteraction(
        document.hidden ? 'tab_hidden' : 'tab_visible',
        {
          visibility_state: document.hidden ? 'hidden' : 'visible',
          timestamp: Date.now()
        }
      )
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      analytics.trackMobileInteraction('network_online', {
        timestamp: Date.now(),
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      })
    }

    const handleOffline = () => {
      analytics.trackMobileInteraction('network_offline', {
        timestamp: Date.now()
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Track device orientation changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.screen?.orientation) return

    const handleOrientationChange = () => {
      analytics.trackMobileInteraction('orientation_change', {
        orientation: window.screen.orientation.type,
        angle: window.screen.orientation.angle,
        timestamp: Date.now()
      })
    }

    window.screen.orientation.addEventListener('change', handleOrientationChange)

    return () => {
      window.screen.orientation.removeEventListener('change', handleOrientationChange)
    }
  }, [])

  // Track touch interactions on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobile) return

    let touchStartTime = 0
    let touchStartX = 0
    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartTime = Date.now()
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        const touchEndX = e.changedTouches[0].clientX
        const touchEndY = e.changedTouches[0].clientY
        const touchDuration = Date.now() - touchStartTime
        const distance = Math.sqrt(
          Math.pow(touchEndX - touchStartX, 2) + Math.pow(touchEndY - touchStartY, 2)
        )

        // Track long press
        if (touchDuration > 500) {
          analytics.trackMobileInteraction('long_press', {
            duration: touchDuration,
            distance: Math.round(distance),
            timestamp: Date.now()
          })
        }

        // Track swipe gestures
        if (distance > 50 && touchDuration < 500) {
          const angle = Math.atan2(touchEndY - touchStartY, touchEndX - touchStartX) * 180 / Math.PI
          let direction = 'unknown'

          if (Math.abs(angle) <= 45) direction = 'right'
          else if (Math.abs(angle) >= 135) direction = 'left'
          else if (angle > 45 && angle < 135) direction = 'down'
          else if (angle < -45 && angle > -135) direction = 'up'

          analytics.trackMobileInteraction('swipe_gesture', {
            direction,
            distance: Math.round(distance),
            duration: touchDuration,
            angle: Math.round(angle),
            timestamp: Date.now()
          })
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile])

  // Track scroll behavior
  useEffect(() => {
    if (typeof window === 'undefined') return

    let scrollDepth = 0
    let maxScrollDepth = 0

    const handleScroll = () => {
      const scrolled = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      const roundedScroll = Math.round(scrolled / 10) * 10 // Round to nearest 10%

      if (roundedScroll > scrollDepth && roundedScroll > maxScrollDepth) {
        scrollDepth = roundedScroll
        maxScrollDepth = scrollDepth

        analytics.trackMobileInteraction('scroll_depth', {
          depth_percentage: scrollDepth,
          max_depth_percentage: maxScrollDepth,
          viewport_height: window.innerHeight,
          document_height: document.documentElement.scrollHeight,
          timestamp: Date.now()
        })
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
  }, [])

  return <>{children}</>
}

// Enhanced casino analytics hook
export function useCasinoAnalytics() {
  const trackCasinoView = (casinoId: string, casinoName: string) => {
    analytics.trackCasinoInteraction(casinoId, 'view', {
      casino_name: casinoName,
      view_timestamp: Date.now()
    })
  }

  const trackCasinoClick = (casinoId: string, casinoName: string, buttonType: string) => {
    analytics.trackCasinoInteraction(casinoId, 'click', {
      casino_name: casinoName,
      button_type: buttonType,
      click_timestamp: Date.now()
    })
  }

  const trackCasinoFilter = (filterType: string, filterValue: string) => {
    analytics.trackEvent({
      action: 'filter_applied',
      category: 'Casino Filter',
      label: `${filterType}:${filterValue}`,
      customParameters: {
        filter_type: filterType,
        filter_value: filterValue,
        timestamp: Date.now()
      }
    })
  }

  const trackSearchQuery = (query: string, resultsCount: number) => {
    analytics.trackEvent({
      action: 'search_performed',
      category: 'Search',
      label: query,
      value: resultsCount,
      customParameters: {
        search_query: query,
        results_count: resultsCount,
        has_results: resultsCount > 0,
        timestamp: Date.now()
      }
    })
  }

  const trackError = (error: Error, context?: Record<string, any>) => {
    analytics.trackError(error, context)
  }

  return {
    trackCasinoView,
    trackCasinoClick,
    trackCasinoFilter,
    trackSearchQuery,
    trackError
  }
}
