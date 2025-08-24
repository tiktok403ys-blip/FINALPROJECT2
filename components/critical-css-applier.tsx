"use client"

import { useEffect, useMemo, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useMobileFirst } from '@/hooks/use-mobile-first'
import { mobileCriticalCSS, pageCriticalCSS } from '@/lib/critical-css/mobile-critical-css'
import { useFontPreloading, useFontPerformanceMonitoring } from '@/lib/font-preloader'
import { trackEvent } from '@/lib/analytics'

interface CriticalCSSApplierProps {
  children: React.ReactNode
  enableFontPreloading?: boolean
  enablePerformanceTracking?: boolean
}

export function CriticalCSSApplier({
  children,
  enableFontPreloading = true,
  enablePerformanceTracking = true
}: CriticalCSSApplierProps) {
  const pathname = usePathname()
  const { isMobile } = useMobileFirst()
  const { preloadCriticalFonts, applyFontOptimization, areFontsLoaded } = useFontPreloading()
  const fontMetrics = useFontPerformanceMonitoring()

  // Determine page type from pathname
  const pageType = useMemo(() => {
    if (pathname.startsWith('/casinos')) return 'casinos'
    if (pathname.startsWith('/bonuses')) return 'bonuses'
    if (pathname.startsWith('/reviews')) return 'reviews'
    if (pathname === '/' || pathname === '/home') return 'home'
    return null
  }, [pathname])

  // Generate critical CSS for current page
  const criticalCSS = useMemo(() => {
    let css = mobileCriticalCSS

    // Add page-specific CSS
    if (pageType && pageCriticalCSS[pageType]) {
      css += pageCriticalCSS[pageType]
    }

    // Add mobile-specific optimizations
    if (isMobile) {
      css += `
        /* Mobile-specific critical optimizations */
        .mobile-optimized {
          contain: layout style paint;
          transform: translateZ(0);
          will-change: transform;
        }

        .mobile-touch-target {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }

        .mobile-scroll-optimized {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        .mobile-font-optimized {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-display: swap;
          -webkit-font-smoothing: antialiased;
        }
      `
    }

    return css
  }, [pageType, isMobile])

  // Apply critical CSS
  useEffect(() => {
    if (typeof document === 'undefined') return

    const startTime = performance.now()

    // Create or update critical CSS style element
    let styleElement = document.getElementById('critical-css')

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'critical-css'
      styleElement.setAttribute('data-critical', 'true')

      // Insert at the beginning of head for highest priority
      const firstStyle = document.head.querySelector('style')
      if (firstStyle) {
        document.head.insertBefore(styleElement, firstStyle)
      } else {
        document.head.appendChild(styleElement)
      }
    }

    // Apply critical CSS
    styleElement.textContent = criticalCSS

    const loadTime = performance.now() - startTime

    if (enablePerformanceTracking) {
      trackEvent({
        action: 'critical_css_applied',
        category: 'Performance',
        label: pageType || 'unknown',
        value: Math.round(loadTime),
        customParameters: {
          page_type: pageType,
          css_size: criticalCSS.length,
          load_time: Math.round(loadTime),
          is_mobile: isMobile,
          pathname: pathname
        }
      })
    }

    console.log(`[CriticalCSS] Applied ${criticalCSS.length} bytes in ${Math.round(loadTime)}ms for ${pageType || 'unknown'} page`)

  }, [criticalCSS, pageType, isMobile, pathname, enablePerformanceTracking])

  // Font preloading
  useEffect(() => {
    if (!enableFontPreloading) return

    const initializeFonts = async () => {
      try {
        // Apply font optimization first
        applyFontOptimization()

        // Preload critical fonts
        const criticalMetrics = await preloadCriticalFonts()
        console.log('[FontLoader] Critical fonts loaded:', criticalMetrics)

        if (enablePerformanceTracking) {
          trackEvent({
            action: 'critical_fonts_loaded',
            category: 'Performance',
            label: 'font_preloading',
            customParameters: {
              fonts_loaded: criticalMetrics.length,
              average_load_time: Math.round(criticalMetrics.reduce((sum, m) => sum + m.loadTime, 0) / criticalMetrics.length),
              cached_fonts: criticalMetrics.filter(m => m.cached).length
            }
          })
        }

        // Load secondary fonts after a delay
        setTimeout(async () => {
          const secondaryMetrics = await preloadCriticalFonts()
          console.log('[FontLoader] Secondary fonts loaded:', secondaryMetrics)
        }, 1000)

      } catch (error) {
        console.error('[FontLoader] Failed to preload fonts:', error)
      }
    }

    initializeFonts()
  }, [enableFontPreloading, applyFontOptimization, preloadCriticalFonts, enablePerformanceTracking])

  // Monitor font loading performance
  useEffect(() => {
    if (!enablePerformanceTracking) return

    const fontCheckInterval = setInterval(() => {
      if (areFontsLoaded()) {
        trackEvent({
          action: 'all_fonts_loaded',
          category: 'Performance',
          label: 'font_loading_complete',
          customParameters: {
            page_type: pageType,
            pathname: pathname,
            font_metrics: JSON.stringify(fontMetrics)
          }
        })
        clearInterval(fontCheckInterval)
      }
    }, 1000)

    return () => clearInterval(fontCheckInterval)
  }, [areFontsLoaded, enablePerformanceTracking, pageType, pathname, fontMetrics])

  // Remove critical CSS after page load and fonts are ready
  useEffect(() => {
    if (typeof document === 'undefined') return

    const removeCriticalCSS = () => {
      const styleElement = document.getElementById('critical-css')
      if (styleElement && areFontsLoaded()) {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          styleElement.remove()
          console.log('[CriticalCSS] Removed after fonts loaded')
        }, 100)
      }
    }

    // Remove after page is fully loaded and fonts are ready
    if (document.readyState === 'complete') {
      removeCriticalCSS()
    } else {
      window.addEventListener('load', removeCriticalCSS)
      return () => window.removeEventListener('load', removeCriticalCSS)
    }
  }, [areFontsLoaded])

  return (
    <>
      {/* Performance monitoring overlay for development */}
      {enablePerformanceTracking && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg p-3 text-xs font-mono z-50 max-w-xs">
          <div className="space-y-2">
            <div className="text-[#00ff88] font-semibold">Critical CSS Applied</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Page:</span>
                <span className="text-white">{pageType || 'unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fonts:</span>
                <span className={`text-white ${areFontsLoaded() ? 'text-green-400' : 'text-yellow-400'}`}>
                  {areFontsLoaded() ? 'Loaded' : 'Loading'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mobile:</span>
                <span className="text-white">{isMobile ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add performance classes to body */}
      {typeof document !== 'undefined' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.documentElement.classList.add('mobile-optimized');
              document.body.classList.add('mobile-font-optimized', 'mobile-scroll-optimized');
            `
          }}
        />
      )}

      {children}
    </>
  )
}

// Specialized critical CSS applier for casino pages
export function CasinoCriticalCSS({ children }: { children: React.ReactNode }) {
  return (
    <CriticalCSSApplier enableFontPreloading={true} enablePerformanceTracking={true}>
      {children}
    </CriticalCSSApplier>
  )
}

// Hook for manual critical CSS management
export function useCriticalCSS() {
  const { isMobile } = useMobileFirst()
  const { applyFontOptimization, preloadCriticalFonts, areFontsLoaded } = useFontPreloading()

  const applyPageCriticalCSS = useCallback((pageType: keyof typeof pageCriticalCSS) => {
    if (typeof document === 'undefined') return

    const startTime = performance.now()

    let css = mobileCriticalCSS
    if (pageCriticalCSS[pageType]) {
      css += pageCriticalCSS[pageType]
    }

    // Apply the CSS
    let styleElement = document.getElementById(`critical-css-${pageType}`)
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = `critical-css-${pageType}`
      styleElement.setAttribute('data-critical', 'true')
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = css

    const loadTime = performance.now() - startTime

    trackEvent({
      action: 'page_critical_css_applied',
      category: 'Performance',
      label: pageType,
      value: Math.round(loadTime),
      customParameters: {
        page_type: pageType,
        css_size: css.length,
        load_time: Math.round(loadTime),
        is_mobile: isMobile
      }
    })

    console.log(`[CriticalCSS] Applied ${css.length} bytes for ${pageType} in ${Math.round(loadTime)}ms`)
  }, [isMobile])

  const removePageCriticalCSS = useCallback((pageType: string) => {
    if (typeof document === 'undefined') return

    const styleElement = document.getElementById(`critical-css-${pageType}`)
    if (styleElement) {
      styleElement.remove()
      console.log(`[CriticalCSS] Removed for ${pageType}`)
    }
  }, [])

  return {
    applyPageCriticalCSS,
    removePageCriticalCSS,
    applyFontOptimization,
    preloadCriticalFonts,
    areFontsLoaded
  }
}

// Performance monitoring component for critical CSS
export function CriticalCSSPerformanceMonitor() {
  const { isMobile } = useMobileFirst()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    // Monitor largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any

      if (lastEntry) {
        trackEvent({
          action: 'largest_contentful_paint',
          category: 'Performance',
          label: lastEntry.url || 'unknown',
          value: Math.round(lastEntry.startTime),
          customParameters: {
            element_type: lastEntry.element?.tagName || 'unknown',
            size: `${lastEntry.size || 0}x${lastEntry.size || 0}`,
            is_mobile: isMobile
          }
        })
      }
    })

    // Monitor first input delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[]

      entries.forEach(entry => {
        trackEvent({
          action: 'first_input_delay',
          category: 'Performance',
          label: entry.name,
          value: Math.round(entry.processingStart - entry.startTime),
          customParameters: {
            input_type: entry.name,
            target_element: entry.target?.tagName || 'unknown',
            is_mobile: isMobile
          }
        })
      })
    })

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
    }

    return () => {
      lcpObserver.disconnect()
      fidObserver.disconnect()
    }
  }, [isMobile])

  return null
}
