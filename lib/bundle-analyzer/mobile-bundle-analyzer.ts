// Mobile-optimized bundle analyzer and code splitting utilities
// Designed to minimize bundle size and optimize loading for mobile devices

import { useEffect, useState, useCallback } from 'react'
import { useMobileFirst } from '@/hooks/use-mobile-first'
import { logger } from '@/lib/logger'

interface BundleMetrics {
  totalSize: number
  gzippedSize: number
  brotliSize: number
  chunks: BundleChunk[]
  assets: BundleAsset[]
  recommendations: string[]
  mobileScore: number
}

interface BundleChunk {
  id: string
  size: number
  gzippedSize: number
  modules: string[]
  reasons: string[]
  isEntry: boolean
  isMobileCritical: boolean
}

interface BundleAsset {
  name: string
  size: number
  gzippedSize: number
  type: 'js' | 'css' | 'image' | 'font' | 'other'
  isCritical: boolean
  preload: boolean
}

interface BundleAnalysisConfig {
  maxBundleSize: {
    mobile: number // in bytes
    desktop: number
  }
  maxChunkSize: {
    mobile: number
    desktop: number
  }
  criticalChunkThreshold: number
  alertThreshold: number // percentage
}

// Default configuration for mobile-first bundle analysis
const defaultConfig: BundleAnalysisConfig = {
  maxBundleSize: {
    mobile: 200 * 1024, // 200KB
    desktop: 300 * 1024 // 300KB
  },
  maxChunkSize: {
    mobile: 50 * 1024, // 50KB
    desktop: 100 * 1024 // 100KB
  },
  criticalChunkThreshold: 1024 * 10, // 10KB - below this is critical
  alertThreshold: 0.9 // 90%
}

export class MobileBundleAnalyzer {
  private static instance: MobileBundleAnalyzer
  private config: BundleAnalysisConfig
  private analysisCache = new Map<string, BundleMetrics>()
  private performanceObserver: PerformanceObserver | null = null

  static getInstance(config?: Partial<BundleAnalysisConfig>): MobileBundleAnalyzer {
    if (!MobileBundleAnalyzer.instance) {
      MobileBundleAnalyzer.instance = new MobileBundleAnalyzer(config)
    }
    return MobileBundleAnalyzer.instance
  }

  constructor(config?: Partial<BundleAnalysisConfig>) {
    this.config = { ...defaultConfig, ...config }
    this.initializePerformanceObserver()
  }

  // Analyze current bundle performance
  async analyzeCurrentBundle(): Promise<BundleMetrics> {
    if (typeof window === 'undefined') {
      return this.getEmptyMetrics()
    }

    const cacheKey = 'current-bundle'
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!
    }

    try {
      // Get resource timing data
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      // Analyze JavaScript resources
      const jsResources = resources.filter(r =>
        r.name.endsWith('.js') ||
        r.name.includes('.js?') ||
        r.name.includes('/_next/static/')
      )

      // Calculate bundle metrics
      const totalSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      const totalEncodedSize = jsResources.reduce((sum, r) => sum + (r.encodedBodySize || 0), 0)

      // Estimate gzipped size (rough approximation)
      const estimatedGzippedSize = Math.round(totalSize * 0.3)

      // Create chunks from resource data
      const chunks: BundleChunk[] = jsResources.map((resource, index) => ({
        id: `chunk-${index}`,
        size: resource.transferSize || 0,
        gzippedSize: Math.round((resource.transferSize || 0) * 0.3),
        modules: [resource.name],
        reasons: ['Initial bundle'],
        isEntry: resource.name.includes('/_next/static/chunks/main'),
        isMobileCritical: this.isCriticalResource(resource.name)
      }))

      // Create assets from all resources
      const assets: BundleAsset[] = resources.map(resource => ({
        name: resource.name,
        size: resource.transferSize || 0,
        gzippedSize: Math.round((resource.transferSize || 0) * 0.3),
        type: this.getAssetType(resource.name),
        isCritical: this.isCriticalResource(resource.name),
        preload: resource.name.includes('critical') || resource.transferSize < this.config.criticalChunkThreshold
      }))

      // Generate recommendations
      const recommendations = this.generateRecommendations(chunks, assets, totalSize)

      // Calculate mobile score
      const mobileScore = this.calculateMobileScore(totalSize, chunks, assets)

      const metrics: BundleMetrics = {
        totalSize,
        gzippedSize: estimatedGzippedSize,
        brotliSize: Math.round(estimatedGzippedSize * 0.9),
        chunks,
        assets,
        recommendations,
        mobileScore
      }

      this.analysisCache.set(cacheKey, metrics)
      return metrics

    } catch (error) {
      logger.error('Bundle analysis error:', error as Error)
      return this.getEmptyMetrics()
    }
  }

  // Check if resource is critical for mobile
  private isCriticalResource(resourceName: string): boolean {
    const criticalPatterns = [
      /main/,
      /framework/,
      /webpack/,
      /pages\/_app/,
      /pages\/index/,
      /casino/, // Critical for casino pages
      /mobile/, // Mobile-specific code
      /critical/ // Explicitly marked critical
    ]

    return criticalPatterns.some(pattern => pattern.test(resourceName))
  }

  // Get asset type from filename
  private getAssetType(filename: string): BundleAsset['type'] {
    if (filename.endsWith('.js') || filename.includes('.js?')) return 'js'
    if (filename.endsWith('.css') || filename.includes('.css?')) return 'css'
    if (/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i.test(filename)) return 'image'
    if (/\.(woff|woff2|ttf|eot)$/i.test(filename)) return 'font'
    return 'other'
  }

  // Generate optimization recommendations
  private generateRecommendations(
    chunks: BundleChunk[],
    assets: BundleAsset[],
    totalSize: number
  ): string[] {
    const recommendations: string[] = []

    // Check bundle size
    if (totalSize > this.config.maxBundleSize.mobile) {
      recommendations.push(`📦 Bundle size (${this.formatBytes(totalSize)}) exceeds mobile limit (${this.formatBytes(this.config.maxBundleSize.mobile)})`)
    }

    // Check large chunks
    const largeChunks = chunks.filter(chunk => chunk.size > this.config.maxChunkSize.mobile)
    if (largeChunks.length > 0) {
      recommendations.push(`🔄 ${largeChunks.length} chunks exceed mobile chunk size limit (${this.formatBytes(this.config.maxChunkSize.mobile)})`)
    }

    // Check for unused code
    const nonCriticalChunks = chunks.filter(chunk => !chunk.isMobileCritical)
    if (nonCriticalChunks.length > chunks.length * 0.7) {
      recommendations.push('🧹 Consider lazy loading non-critical chunks')
    }

    // Check for large images
    const largeImages = assets.filter(asset =>
      asset.type === 'image' &&
      asset.size > 100 * 1024 // 100KB
    )
    if (largeImages.length > 0) {
      recommendations.push(`🖼️ ${largeImages.length} large images found, consider optimization`)
    }

    // Check for multiple fonts
    const fontAssets = assets.filter(asset => asset.type === 'font')
    if (fontAssets.length > 2) {
      recommendations.push(`🔤 ${fontAssets.length} font files loaded, consider font subsetting`)
    }

    return recommendations
  }

  // Calculate mobile performance score
  private calculateMobileScore(totalSize: number, chunks: BundleChunk[], assets: BundleAsset[]): number {
    let score = 100

    // Bundle size penalty
    const sizeRatio = totalSize / this.config.maxBundleSize.mobile
    if (sizeRatio > 1) {
      score -= (sizeRatio - 1) * 20 // 20 points per 100% over limit
    }

    // Large chunk penalty
    const largeChunks = chunks.filter(chunk => chunk.size > this.config.maxChunkSize.mobile)
    score -= largeChunks.length * 5 // 5 points per large chunk

    // Non-critical chunks bonus (for code splitting)
    const criticalRatio = chunks.filter(c => c.isMobileCritical).length / chunks.length
    if (criticalRatio < 0.5) {
      score += 10 // Bonus for good code splitting
    }

    // Asset optimization bonus
    const optimizedImages = assets.filter(a =>
      a.type === 'image' &&
      (a.name.includes('.webp') || a.name.includes('.avif'))
    )
    const imageCount = assets.filter(a => a.type === 'image').length
    if (imageCount > 0 && optimizedImages.length === imageCount) {
      score += 5 // Bonus for all images optimized
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  // Initialize performance observer for real-time monitoring
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()

        entries.forEach(entry => {
          if (entry.entryType === 'resource' && this.isCriticalResource(entry.name)) {
            this.trackCriticalResourceLoad(entry as PerformanceResourceTiming)
          }
        })
      })

      this.performanceObserver.observe({ entryTypes: ['resource'] })

    } catch (error) {
      logger.error('Performance observer initialization failed:', error as Error)
    }
  }

  // Track critical resource loading
  private trackCriticalResourceLoad(entry: PerformanceResourceTiming): void {
    const loadTime = entry.responseEnd - entry.requestStart
    const size = entry.transferSize

    // Track with analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'critical_resource_load', {
        event_category: 'Performance',
        event_label: entry.name,
        value: Math.round(loadTime),
        custom_parameter_1: this.formatBytes(size),
        custom_parameter_2: entry.name.includes('mobile') ? 'mobile' : 'desktop'
      })
    }

    // Log slow resources
    if (loadTime > 1000) { // 1 second
      logger.warn(`🚨 Slow critical resource: ${entry.name} (${Math.round(loadTime)}ms)`)
    }
  }

  // Format bytes for display
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get empty metrics for SSR
  private getEmptyMetrics(): BundleMetrics {
    return {
      totalSize: 0,
      gzippedSize: 0,
      brotliSize: 0,
      chunks: [],
      assets: [],
      recommendations: [],
      mobileScore: 0
    }
  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    this.analysisCache.clear()
  }
}

// React hook for bundle analysis
export function useBundleAnalysis() {
  const { isMobile } = useMobileFirst()
  const [metrics, setMetrics] = useState<BundleMetrics | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzer = MobileBundleAnalyzer.getInstance()

  const analyze = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      const result = await analyzer.analyzeCurrentBundle()
      setMetrics(result)
    } catch (error) {
      logger.error('Bundle analysis failed:', error as Error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [analyzer])

  useEffect(() => {
    // Auto-analyze on mobile or when explicitly requested
    if (isMobile) {
      analyze()
    }
  }, [isMobile, analyze])

  return {
    metrics,
    isAnalyzing,
    analyze,
    analyzer
  }
}

// Bundle size tracker component
export function BundleSizeTracker({ children }: { children: React.ReactNode }) {
  const { metrics } = useBundleAnalysis()

  useEffect(() => {
    if (metrics && typeof window !== 'undefined') {
      // Store metrics in session storage for debugging
      sessionStorage.setItem('bundle-metrics', JSON.stringify(metrics))

      // Log recommendations
      if (metrics.recommendations.length > 0) {
        console.group('📊 Bundle Analysis Recommendations')
        metrics.recommendations.forEach(rec => logger.log(rec))
        console.groupEnd()
      }

      // Log mobile score
      logger.log(`📱 Mobile Bundle Score: ${metrics.mobileScore}/100`)
    }
  }, [metrics])

  return children
}

// Utility functions for bundle optimization
export const bundleUtils = {
  // Check if bundle size is within limits
  isWithinLimits(size: number, isMobile: boolean): boolean {
    const limit = isMobile ? defaultConfig.maxBundleSize.mobile : defaultConfig.maxBundleSize.desktop
    return size <= limit
  },

  // Get size warning level
  getSizeWarning(size: number, isMobile: boolean): 'success' | 'warning' | 'error' {
    const limit = isMobile ? defaultConfig.maxBundleSize.mobile : defaultConfig.maxBundleSize.desktop
    const ratio = size / limit

    if (ratio <= 0.8) return 'success'
    if (ratio <= 0.95) return 'warning'
    return 'error'
  },

  // Format bundle size for display
  formatBundleSize(size: number): string {
    const kb = size / 1024
    if (kb < 1024) return `${Math.round(kb)}KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)}MB`
  },

  // Get bundle optimization tips
  getOptimizationTips(metrics: BundleMetrics): string[] {
    const tips: string[] = []

    // Bundle size tips
    if (metrics.totalSize > defaultConfig.maxBundleSize.mobile) {
      tips.push('Implement code splitting to reduce initial bundle size')
    }

    // Large chunk tips
    const largeChunks = metrics.chunks.filter(c => c.size > defaultConfig.maxChunkSize.mobile)
    if (largeChunks.length > 0) {
      tips.push(`Split ${largeChunks.length} large chunks into smaller modules`)
    }

    // Image optimization tips
    const unoptimizedImages = metrics.assets.filter(a =>
      a.type === 'image' &&
      !a.name.includes('.webp') &&
      !a.name.includes('.avif')
    )
    if (unoptimizedImages.length > 0) {
      tips.push(`Optimize ${unoptimizedImages.length} images to WebP/AVIF format`)
    }

    return tips
  }
}
