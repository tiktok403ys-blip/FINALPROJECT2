// Mobile-optimized font loading configuration
// Designed to minimize font loading impact on mobile performance

import { Inter, Roboto_Mono } from 'next/font/google'
import { useEffect, useState, useCallback } from 'react'
import { useMobileFirst } from '@/hooks/use-mobile-first'
import { logger } from '@/lib/logger'

// Base font configuration optimized for mobile
const baseFontConfig = {
  subsets: ['latin'],
  display: 'swap' as const, // Critical for mobile performance
  preload: false, // Don't preload by default
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true
}

// Mobile-optimized Inter font
export const interMobile = Inter({
  ...baseFontConfig,
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], // Reduced weights for mobile
  variable: '--font-inter-mobile',
  display: 'swap',
  preload: true, // Preload Inter as it's the primary font
})

// Mobile-optimized Roboto Mono for code blocks
export const robotoMonoMobile = Roboto_Mono({
  ...baseFontConfig,
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-roboto-mono-mobile',
  display: 'swap',
  preload: false, // Don't preload monospace font
})

// Font loading strategy for mobile
export class MobileFontLoader {
  private static instance: MobileFontLoader
  private loadedFonts = new Set<string>()
  private fontPromises = new Map<string, Promise<void>>()

  static getInstance(): MobileFontLoader {
    if (!MobileFontLoader.instance) {
      MobileFontLoader.instance = new MobileFontLoader()
    }
    return MobileFontLoader.instance
  }

  // Load font with mobile optimizations
  async loadFont(fontName: string, options: {
    priority?: 'high' | 'low'
    timeout?: number
    onProgress?: (progress: number) => void
  } = {}): Promise<void> {
    const { priority = 'low', timeout = 3000, onProgress } = options

    // Return if already loaded
    if (this.loadedFonts.has(fontName)) {
      return Promise.resolve()
    }

    // Return existing promise if loading
    if (this.fontPromises.has(fontName)) {
      return this.fontPromises.get(fontName)!
    }

    const fontPromise = this.loadFontInternal(fontName, { priority, timeout, onProgress })
    this.fontPromises.set(fontName, fontPromise)

    try {
      await fontPromise
      this.loadedFonts.add(fontName)
    } finally {
      this.fontPromises.delete(fontName)
    }

    return fontPromise
  }

  private async loadFontInternal(
    fontName: string,
    options: { priority: 'high' | 'low'; timeout: number; onProgress?: (progress: number) => void }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if Font Loading API is available
      if (!('fonts' in document)) {
        logger.warn('Font Loading API not supported')
        resolve()
        return
      }

      const fontFace = this.getFontFace(fontName)
      if (!fontFace) {
        reject(new Error(`Font ${fontName} not found`))
        return
      }

      // Set font loading priority
      if (options.priority === 'high') {
        // Use high priority for critical fonts
        fontFace.load().then(() => {
          document.fonts.add(fontFace)
          resolve()
        }).catch(reject)
      } else {
        // Use low priority with timeout
        const timeoutId = setTimeout(() => {
          reject(new Error(`Font ${fontName} loading timeout`))
        }, options.timeout)

        fontFace.load().then(() => {
          clearTimeout(timeoutId)
          document.fonts.add(fontFace)
          options.onProgress?.(100)
          resolve()
        }).catch((error) => {
          clearTimeout(timeoutId)
          reject(error)
        })

        // Report loading progress
        if (options.onProgress) {
          // Simulate progress for better UX
          let progress = 0
          const progressInterval = setInterval(() => {
            progress += Math.random() * 30
            if (progress >= 90) {
              clearInterval(progressInterval)
              options.onProgress!(90)
            } else {
              options.onProgress!(progress)
            }
          }, 100)
        }
      }
    })
  }

  private getFontFace(fontName: string): FontFace | null {
    switch (fontName) {
      case 'inter':
        return new FontFace(
          'Inter',
          'url(/fonts/inter-regular.woff2) format("woff2")',
          { weight: '400', display: 'swap' }
        )
      case 'inter-bold':
        return new FontFace(
          'Inter',
          'url(/fonts/inter-bold.woff2) format("woff2")',
          { weight: '700', display: 'swap' }
        )
      case 'roboto-mono':
        return new FontFace(
          'Roboto Mono',
          'url(/fonts/roboto-mono-regular.woff2) format("woff2")',
          { weight: '400', display: 'swap' }
        )
      default:
        return null
    }
  }

  // Preload critical fonts for mobile
  async preloadCriticalFonts(): Promise<void> {
    const criticalFonts = ['inter'] // Only preload essential fonts

    await Promise.all(
      criticalFonts.map(font =>
        this.loadFont(font, { priority: 'high', timeout: 2000 })
      )
    )
  }

  // Load non-critical fonts with lower priority
  async loadNonCriticalFonts(): Promise<void> {
    const nonCriticalFonts = ['inter-bold', 'roboto-mono']

    // Load with low priority and longer timeout
    await Promise.allSettled(
      nonCriticalFonts.map(font =>
        this.loadFont(font, { priority: 'low', timeout: 5000 })
      )
    )
  }

  // Check if font is loaded
  isFontLoaded(fontName: string): boolean {
    return this.loadedFonts.has(fontName)
  }

  // Get font loading status
  getFontStatus(): Record<string, 'loading' | 'loaded' | 'error' | 'not-loaded'> {
    const status: Record<string, 'loading' | 'loaded' | 'error' | 'not-loaded'> = {}

    const allFonts = ['inter', 'inter-bold', 'roboto-mono']

    allFonts.forEach(font => {
      if (this.loadedFonts.has(font)) {
        status[font] = 'loaded'
      } else if (this.fontPromises.has(font)) {
        status[font] = 'loading'
      } else {
        status[font] = 'not-loaded'
      }
    })

    return status
  }
}

// Mobile font optimization utilities
export const mobileFontUtils = {
  // Generate font CSS variables for mobile
  generateFontCSS(isMobile: boolean): Record<string, string> {
    if (isMobile) {
      return {
        '--font-size-base': '14px',
        '--font-size-sm': '12px',
        '--font-size-lg': '16px',
        '--font-size-xl': '18px',
        '--line-height-base': '1.4',
        '--line-height-heading': '1.2',
        '--font-weight-light': '300',
        '--font-weight-normal': '400',
        '--font-weight-medium': '500',
        '--font-weight-bold': '600'
      }
    }

    return {
      '--font-size-base': '16px',
      '--font-size-sm': '14px',
      '--font-size-lg': '18px',
      '--font-size-xl': '20px',
      '--line-height-base': '1.5',
      '--line-height-heading': '1.3',
      '--font-weight-light': '300',
      '--font-weight-normal': '400',
      '--font-weight-medium': '500',
      '--font-weight-bold': '700'
    }
  },

  // Apply font optimization classes
  getFontClasses(isMobile: boolean): string {
    const baseClasses = 'font-inter-mobile'

    if (isMobile) {
      return `${baseClasses} text-sm leading-relaxed`
    }

    return `${baseClasses} text-base leading-normal`
  },

  // Optimize font rendering for mobile
  applyFontRenderingOptimization(): void {
    if (typeof document === 'undefined') return

    const style = document.createElement('style')
    style.textContent = `
      /* Font rendering optimizations for mobile */
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }

      /* Optimize font loading on mobile */
      @media (max-width: 768px) {
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-display: swap;
        }

        .font-inter-mobile {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      }

      /* Preload critical fonts */
      @font-face {
        font-family: 'Inter';
        src: url('/fonts/inter-regular.woff2') format('woff2');
        font-weight: 400;
        font-display: swap;
        font-style: normal;
      }

      @font-face {
        font-family: 'Inter';
        src: url('/fonts/inter-medium.woff2') format('woff2');
        font-weight: 500;
        font-display: swap;
        font-style: normal;
      }
    `

    document.head.appendChild(style)
  },

  // Monitor font loading performance
  trackFontPerformance(): void {
    if (typeof window === 'undefined' || !('fonts' in document)) return

    document.fonts.addEventListener('loading', (event) => {
      logger.log('Font loading started:', { metadata: { fontFamily: event.fontfaces?.[0]?.family || 'Unknown font' } })
    })

    document.fonts.addEventListener('loadingdone', (event) => {
      logger.log('Font loaded successfully:', { metadata: { fontFamily: event.fontfaces?.[0]?.family || 'Unknown font' } })
    })

    document.fonts.addEventListener('loadingerror', (event) => {
      logger.error('Font loading error:', new Error('Font loading failed'), { metadata: { fontFamily: event.fontfaces?.[0]?.family || 'Unknown font' } })
    })
  },

  // Fallback font strategy for mobile
  getFallbackFontStack(): string {
    return `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
  },

  // Optimize font size for mobile readability
  getMobileFontSize(baseSize: number): number {
    // Ensure minimum 14px font size for mobile readability
    return Math.max(baseSize * 0.875, 14)
  }
}

// Hook for using mobile-optimized fonts
export function useMobileOptimizedFonts() {
  const fontLoader = MobileFontLoader.getInstance()

  const loadCriticalFonts = async () => {
    try {
      await fontLoader.preloadCriticalFonts()
      logger.log('Critical fonts loaded successfully')
    } catch (error) {
      logger.error('Failed to load critical fonts:', error as Error)
    }
  }

  const loadNonCriticalFonts = async () => {
    try {
      await fontLoader.loadNonCriticalFonts()
      logger.log('Non-critical fonts loaded successfully')
    } catch (error) {
      logger.warn('Some non-critical fonts failed to load:', { metadata: { error: String(error) } })
    }
  }

  const getFontStatus = () => fontLoader.getFontStatus()

  const isFontLoaded = (fontName: string) => fontLoader.isFontLoaded(fontName)

  return {
    loadCriticalFonts,
    loadNonCriticalFonts,
    getFontStatus,
    isFontLoaded,
    fontLoader
  }
}
