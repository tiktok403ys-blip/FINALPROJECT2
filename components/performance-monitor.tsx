"use client"

import { useEffect, useState, useCallback } from 'react'
import { useMobileFirst } from '@/hooks/use-mobile-first'
import { trackEvent } from '@/lib/analytics'

interface PerformanceMetrics {
  // Core Web Vitals
  FCP: number | null // First Contentful Paint
  LCP: number | null // Largest Contentful Paint
  CLS: number | null // Cumulative Layout Shift
  FID: number | null // First Input Delay
  TTFB: number | null // Time to First Byte

  // Additional metrics
  loadTime: number | null
  domContentLoaded: number | null
  firstPaint: number | null
  resourceCount: number
  totalResourceSize: number

  // React specific
  componentRenderTime: number | null
  hydrationTime: number | null

  // Memory usage
  memoryUsage: number | null

  // Network
  connectionType: string
  effectiveConnectionType: string
}

interface PerformanceMonitorProps {
  casinoId?: string
  pageName?: string
  enableRealTime?: boolean
  reportInterval?: number // in milliseconds
}

export function PerformanceMonitor({
  casinoId,
  pageName = 'unknown',
  enableRealTime = false,
  reportInterval = 30000
}: PerformanceMonitorProps) {
  const { isMobile, isTablet, isDesktop } = useMobileFirst()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    FCP: null,
    LCP: null,
    CLS: null,
    FID: null,
    TTFB: null,
    loadTime: null,
    domContentLoaded: null,
    firstPaint: null,
    resourceCount: 0,
    totalResourceSize: 0,
    componentRenderTime: null,
    hydrationTime: null,
    memoryUsage: null,
    connectionType: 'unknown',
    effectiveConnectionType: 'unknown'
  })

  const [isVisible, setIsVisible] = useState(false)

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Measure Core Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined') return

    let fcpObserver: PerformanceObserver | null = null
    let lcpObserver: PerformanceObserver | null = null
    let clsObserver: PerformanceObserver | null = null
    let fidObserver: PerformanceObserver | null = null

    try {
      // First Contentful Paint (FCP)
      fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')

        if (fcpEntry) {
          const fcpValue = Math.round(fcpEntry.startTime)
          setMetrics(prev => ({ ...prev, FCP: fcpValue }))

          // Track FCP
          trackEvent({
            action: 'core_web_vital',
            category: 'Performance',
            label: 'FCP',
            value: fcpValue,
            customParameters: {
              page: pageName,
              casino_id: casinoId,
              device_type: isMobile ? 'mobile' : isDesktop ? 'desktop' : 'tablet',
              connection_type: metrics.effectiveConnectionType
            }
          })
        }
      })

      // Largest Contentful Paint (LCP)
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any

        if (lastEntry) {
          const lcpValue = Math.round(lastEntry.startTime)
          setMetrics(prev => ({ ...prev, LCP: lcpValue }))

          // Track LCP
          trackEvent({
            action: 'core_web_vital',
            category: 'Performance',
            label: 'LCP',
            value: lcpValue,
            customParameters: {
              page: pageName,
              casino_id: casinoId,
              element_type: lastEntry.element?.tagName || 'unknown',
              url: lastEntry.url || 'unknown'
            }
          })
        }
      })

      // Cumulative Layout Shift (CLS)
      clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries() as any[]

        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })

        const roundedCls = Math.round(clsValue * 100) / 100
        setMetrics(prev => ({ ...prev, CLS: roundedCls }))

        // Track CLS
        trackEvent({
          action: 'core_web_vital',
          category: 'Performance',
          label: 'CLS',
          value: Math.round(roundedCls * 1000), // Convert to milliseconds for consistency
          customParameters: {
            page: pageName,
            casino_id: casinoId,
            total_shifts: entries.length
          }
        })
      })

      // First Input Delay (FID)
      fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[]

        entries.forEach(entry => {
          const fidValue = Math.round(entry.processingStart - entry.startTime)
          setMetrics(prev => ({ ...prev, FID: fidValue }))

          // Track FID
          trackEvent({
            action: 'core_web_vital',
            category: 'Performance',
            label: 'FID',
            value: fidValue,
            customParameters: {
              page: pageName,
              casino_id: casinoId,
              input_type: entry.name,
              target_element: entry.target?.tagName || 'unknown'
            }
          })
        })
      })

      // Start observing
      fcpObserver.observe({ entryTypes: ['paint'] })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      fidObserver.observe({ entryTypes: ['first-input'] })

    } catch (error) {
      console.error('Performance observer error:', error)
    }

    // Cleanup
    return () => {
      fcpObserver?.disconnect()
      lcpObserver?.disconnect()
      clsObserver?.disconnect()
      fidObserver?.disconnect()
    }
  }, [pageName, casinoId, isMobile, isDesktop, metrics.effectiveConnectionType])

  // Measure additional metrics
  useEffect(() => {
    if (typeof window === 'undefined') return

    const measureMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const resources = performance.getEntriesByType('resource')
      const connection = (navigator as any).connection

      setMetrics(prev => ({
        ...prev,
        loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        firstPaint: Math.round(performance.getEntriesByName('first-paint')[0]?.startTime || 0),
        TTFB: Math.round(navigation.responseStart - navigation.requestStart),
        resourceCount: resources.length,
        totalResourceSize: resources.reduce((total, resource) => {
          return total + ((resource as any).transferSize || 0)
        }, 0),
        connectionType: connection?.type || 'unknown',
        effectiveConnectionType: connection?.effectiveType || 'unknown',
        memoryUsage: (performance as any).memory?.usedJSHeapSize || null
      }))
    }

    // Measure on load and after resources are loaded
    if (document.readyState === 'complete') {
      measureMetrics()
    } else {
      window.addEventListener('load', measureMetrics)
      return () => window.removeEventListener('load', measureMetrics)
    }
  }, [])

  // Real-time performance reporting
  useEffect(() => {
    if (!enableRealTime) return

    const reportMetrics = () => {
      const coreWebVitals = {
        FCP: metrics.FCP,
        LCP: metrics.LCP,
        CLS: metrics.CLS,
        FID: metrics.FID,
        TTFB: metrics.TTFB
      }

      // Send to analytics
      trackEvent({
        action: 'performance_report',
        category: 'Performance',
        label: 'real_time_metrics',
        customParameters: {
          page: pageName,
          casino_id: casinoId,
          device_type: isMobile ? 'mobile' : isDesktop ? 'desktop' : 'tablet',
          ...coreWebVitals,
          connection_type: metrics.effectiveConnectionType,
          resource_count: metrics.resourceCount,
          total_resource_size: metrics.totalResourceSize
        }
      })
    }

    const interval = setInterval(reportMetrics, reportInterval)
    return () => clearInterval(interval)
  }, [enableRealTime, reportInterval, metrics, pageName, casinoId, isMobile, isDesktop])

  // Performance monitoring overlay
  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null
  }

  const getScoreColor = (metric: string, value: number | null): string => {
    if (value === null) return 'text-gray-400'

    switch (metric) {
      case 'FCP':
      case 'LCP':
        if (value <= 2500) return 'text-green-400'
        if (value <= 4000) return 'text-yellow-400'
        return 'text-red-400'
      case 'CLS':
        if (value <= 0.1) return 'text-green-400'
        if (value <= 0.25) return 'text-yellow-400'
        return 'text-red-400'
      case 'FID':
      case 'TTFB':
        if (value <= 100) return 'text-green-400'
        if (value <= 300) return 'text-yellow-400'
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getScoreLabel = (metric: string, value: number | null): string => {
    if (value === null) return 'Not measured'

    switch (metric) {
      case 'FCP':
      case 'LCP':
        if (value <= 2500) return 'Good'
        if (value <= 4000) return 'Needs improvement'
        return 'Poor'
      case 'CLS':
        if (value <= 0.1) return 'Good'
        if (value <= 0.25) return 'Needs improvement'
        return 'Poor'
      case 'FID':
      case 'TTFB':
        if (value <= 100) return 'Good'
        if (value <= 300) return 'Needs improvement'
        return 'Poor'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-4 text-xs font-mono z-50 max-w-sm max-h-96 overflow-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Performance Monitor</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Core Web Vitals */}
        <div className="space-y-2">
          <h4 className="text-[#00ff88] font-medium">Core Web Vitals</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/50 rounded p-2">
              <div className="text-gray-400 text-xs">FCP</div>
              <div className={`font-semibold ${getScoreColor('FCP', metrics.FCP)}`}>
                {metrics.FCP ? `${metrics.FCP}ms` : '—'}
              </div>
              <div className="text-xs text-gray-500">{getScoreLabel('FCP', metrics.FCP)}</div>
            </div>

            <div className="bg-black/50 rounded p-2">
              <div className="text-gray-400 text-xs">LCP</div>
              <div className={`font-semibold ${getScoreColor('LCP', metrics.LCP)}`}>
                {metrics.LCP ? `${metrics.LCP}ms` : '—'}
              </div>
              <div className="text-xs text-gray-500">{getScoreLabel('LCP', metrics.LCP)}</div>
            </div>

            <div className="bg-black/50 rounded p-2">
              <div className="text-gray-400 text-xs">CLS</div>
              <div className={`font-semibold ${getScoreColor('CLS', metrics.CLS)}`}>
                {metrics.CLS !== null ? metrics.CLS.toFixed(3) : '—'}
              </div>
              <div className="text-xs text-gray-500">{getScoreLabel('CLS', metrics.CLS)}</div>
            </div>

            <div className="bg-black/50 rounded p-2">
              <div className="text-gray-400 text-xs">FID</div>
              <div className={`font-semibold ${getScoreColor('FID', metrics.FID)}`}>
                {metrics.FID ? `${metrics.FID}ms` : '—'}
              </div>
              <div className="text-xs text-gray-500">{getScoreLabel('FID', metrics.FID)}</div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="space-y-2">
          <h4 className="text-[#00ff88] font-medium">Additional Metrics</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">TTFB:</span>
              <span className={getScoreColor('TTFB', metrics.TTFB)}>
                {metrics.TTFB ? `${metrics.TTFB}ms` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Load Time:</span>
              <span className="text-white">
                {metrics.loadTime ? `${metrics.loadTime}ms` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Resources:</span>
              <span className="text-white">
                {metrics.resourceCount} ({Math.round(metrics.totalResourceSize / 1024)}KB)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Connection:</span>
              <span className="text-white">{metrics.effectiveConnectionType}</span>
            </div>
            {metrics.memoryUsage && (
              <div className="flex justify-between">
                <span className="text-gray-400">Memory:</span>
                <span className="text-white">
                  {Math.round(metrics.memoryUsage / 1024 / 1024)}MB
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Device Info */}
        <div className="space-y-2">
          <h4 className="text-[#00ff88] font-medium">Device Info</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white">
                {isMobile ? 'Mobile' : isDesktop ? 'Desktop' : 'Tablet'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Viewport:</span>
              <span className="text-white">
                {typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Page:</span>
              <span className="text-white">{pageName}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-[#00ff88] rounded px-2 py-1 text-xs transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              const data = {
                timestamp: Date.now(),
                url: window.location.href,
                metrics: metrics,
                userAgent: navigator.userAgent
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `performance-report-${Date.now()}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded px-2 py-1 text-xs transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}