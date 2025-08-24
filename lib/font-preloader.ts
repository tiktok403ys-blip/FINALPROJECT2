// Font preloading and optimization for mobile-first design

import { useState, useEffect } from 'react'

export interface FontPreloadConfig {
  fonts: FontDefinition[]
  timeout: number
  strategy: 'preload' | 'prefetch' | 'preconnect'
}

export interface FontDefinition {
  family: string
  weight: string | number
  style?: string
  src: string
  format?: 'woff2' | 'woff' | 'truetype' | 'opentype'
  display?: 'swap' | 'fallback' | 'optional' | 'block'
}

export interface FontMetrics {
  loadTime: number
  cached: boolean
  success: boolean
  error?: string
}

// Critical fonts that should be preloaded for mobile
const criticalFonts: FontDefinition[] = [
  {
    family: 'Inter',
    weight: 400,
    src: '/fonts/inter-regular.woff2',
    format: 'woff2',
    display: 'swap'
  },
  {
    family: 'Inter',
    weight: 500,
    src: '/fonts/inter-medium.woff2',
    format: 'woff2',
    display: 'swap'
  },
  {
    family: 'Inter',
    weight: 600,
    src: '/fonts/inter-semibold.woff2',
    format: 'woff2',
    display: 'swap'
  },
  {
    family: 'Inter',
    weight: 700,
    src: '/fonts/inter-bold.woff2',
    format: 'woff2',
    display: 'swap'
  }
]

// Secondary fonts (loaded after critical ones)
const secondaryFonts: FontDefinition[] = [
  {
    family: 'Roboto Mono',
    weight: 400,
    src: '/fonts/roboto-mono-regular.woff2',
    format: 'woff2',
    display: 'swap'
  }
]

export class FontPreloader {
  private static instance: FontPreloader
  private loadedFonts = new Set<string>()
  private loadingPromises = new Map<string, Promise<FontMetrics>>()
  private fontMetrics = new Map<string, FontMetrics>()

  static getInstance(): FontPreloader {
    if (!FontPreloader.instance) {
      FontPreloader.instance = new FontPreloader()
    }
    return FontPreloader.instance
  }

  // Preload critical fonts
  async preloadCriticalFonts(): Promise<FontMetrics[]> {
    const promises = criticalFonts.map(font => this.loadFont(font, 'preload'))
    return Promise.all(promises)
  }

  // Load secondary fonts (non-blocking)
  async loadSecondaryFonts(): Promise<FontMetrics[]> {
    const promises = secondaryFonts.map(font => this.loadFont(font, 'prefetch'))
    return Promise.allSettled(promises).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : {
          loadTime: 0,
          cached: false,
          success: false,
          error: 'Failed to load'
        }
      )
    )
  }

  // Load a single font
  async loadFont(font: FontDefinition, strategy: 'preload' | 'prefetch' = 'preload'): Promise<FontMetrics> {
    const fontKey = `${font.family}-${font.weight}-${font.style || 'normal'}`
    const startTime = performance.now()

    // Return cached promise if already loading
    if (this.loadingPromises.has(fontKey)) {
      return this.loadingPromises.get(fontKey)!
    }

    // Return cached metrics if already loaded
    if (this.loadedFonts.has(fontKey)) {
      const cachedMetrics = this.fontMetrics.get(fontKey)
      if (cachedMetrics) return cachedMetrics
    }

    const loadPromise = this.loadFontInternal(font, strategy, startTime)
    this.loadingPromises.set(fontKey, loadPromise)

    const metrics = await loadPromise
    this.loadingPromises.delete(fontKey)

    if (metrics.success) {
      this.loadedFonts.add(fontKey)
      this.fontMetrics.set(fontKey, metrics)
    }

    return metrics
  }

  private async loadFontInternal(
    font: FontDefinition,
    strategy: 'preload' | 'prefetch',
    startTime: number
  ): Promise<FontMetrics> {
    return new Promise((resolve) => {
      try {
        // Create link element for preloading
        const link = document.createElement('link')
        link.rel = strategy
        link.href = font.src
        link.type = `font/${font.format || 'woff2'}`
        link.as = 'font'
        link.crossOrigin = 'anonymous'

        // Add font attributes
        if (font.display) {
          link.setAttribute('data-font-display', font.display)
        }

        // Handle load success
        link.onload = () => {
          const loadTime = performance.now() - startTime
          const metrics: FontMetrics = {
            loadTime,
            cached: false,
            success: true
          }

          // Check if font was served from cache
          if ('transferSize' in performance.getEntriesByName(font.src)[0]) {
            const entry = performance.getEntriesByName(font.src)[0] as any
            metrics.cached = entry.transferSize === 0
          }

          resolve(metrics)
        }

        // Handle load error
        link.onerror = () => {
          const loadTime = performance.now() - startTime
          resolve({
            loadTime,
            cached: false,
            success: false,
            error: `Failed to load font: ${font.src}`
          })
        }

        // Set timeout for slow connections
        setTimeout(() => {
          if (link.parentNode) {
            resolve({
              loadTime: performance.now() - startTime,
              cached: false,
              success: false,
              error: 'Font loading timeout'
            })
          }
        }, 5000)

        // Append to head
        document.head.appendChild(link)

      } catch (error) {
        resolve({
          loadTime: performance.now() - startTime,
          cached: false,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })
  }

  // Generate font-face CSS declarations
  generateFontCSS(): string {
    const allFonts = [...criticalFonts, ...secondaryFonts]
    let css = ''

    allFonts.forEach(font => {
      css += `
@font-face {
  font-family: '${font.family}';
  src: url('${font.src}') format('${font.format || 'woff2'}');
  font-weight: ${font.weight};
  font-style: ${font.style || 'normal'};
  font-display: ${font.display || 'swap'};
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`
    })

    return css
  }

  // Apply font optimization to document
  applyFontOptimization(): void {
    if (typeof document === 'undefined') return

    // Add font-display optimization
    const style = document.createElement('style')
    style.textContent = `
/* Font loading optimization */
.font-optimized {
  font-display: swap;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Critical font loading */
.critical-font {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-display: swap;
}

/* Secondary font loading */
.secondary-font {
  font-family: 'Roboto Mono', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
  font-display: swap;
}

/* Fallback font stack for mobile */
.fallback-font {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Optimize font rendering on mobile */
@media (max-width: 768px) {
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .font-optimized {
    font-variant-numeric: oldstyle-nums;
    font-variant-ligatures: common-ligatures;
  }
}

/* Preload critical fonts */
${this.generateFontCSS()}
`

    document.head.appendChild(style)
  }

  // Check if fonts are loaded
  areFontsLoaded(): boolean {
    if (typeof document === 'undefined') return false

    return criticalFonts.every(font => {
      const fontKey = `${font.family}-${font.weight}-${font.style || 'normal'}`
      return this.loadedFonts.has(fontKey)
    })
  }

  // Get font loading metrics
  getFontMetrics(): Record<string, FontMetrics> {
    const metrics: Record<string, FontMetrics> = {}

    this.fontMetrics.forEach((value, key) => {
      metrics[key] = value
    })

    return metrics
  }

  // Clear font cache (for debugging)
  clearCache(): void {
    this.loadedFonts.clear()
    this.fontMetrics.clear()
    this.loadingPromises.clear()
  }
}

// React hook for font preloading
export function useFontPreloading() {
  const preloader = FontPreloader.getInstance()

  const preloadCriticalFonts = async () => {
    try {
      const metrics = await preloader.preloadCriticalFonts()
      console.log('Critical fonts loaded:', metrics)
      return metrics
    } catch (error) {
      console.error('Failed to preload critical fonts:', error)
      return []
    }
  }

  const loadSecondaryFonts = async () => {
    try {
      const metrics = await preloader.loadSecondaryFonts()
      console.log('Secondary fonts loaded:', metrics)
      return metrics
    } catch (error) {
      console.warn('Failed to load secondary fonts:', error)
      return []
    }
  }

  const applyFontOptimization = () => {
    preloader.applyFontOptimization()
  }

  const areFontsLoaded = () => preloader.areFontsLoaded()

  const getFontMetrics = () => preloader.getFontMetrics()

  return {
    preloadCriticalFonts,
    loadSecondaryFonts,
    applyFontOptimization,
    areFontsLoaded,
    getFontMetrics,
    preloader
  }
}

// Performance monitoring for fonts
export function useFontPerformanceMonitoring() {
  const [fontMetrics, setFontMetrics] = useState<Record<string, FontMetrics>>({})

  useEffect(() => {
    const preloader = FontPreloader.getInstance()

    // Monitor font loading
    const interval = setInterval(() => {
      const metrics = preloader.getFontMetrics()
      setFontMetrics(metrics)

      // Track with analytics if available
      if (typeof window !== 'undefined' && window.gtag) {
        Object.entries(metrics).forEach(([fontKey, metric]) => {
          if (metric.success && !metric.error) {
            window.gtag('event', 'font_loaded', {
              event_category: 'Performance',
              event_label: fontKey,
              value: Math.round(metric.loadTime),
              custom_parameter_1: metric.cached ? 'cached' : 'network'
            })
          }
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return fontMetrics
}
