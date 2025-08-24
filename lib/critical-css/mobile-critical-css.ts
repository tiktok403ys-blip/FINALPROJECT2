// Mobile-optimized critical CSS inlining
// Extract and inline critical CSS for above-the-fold content

import { useState, useEffect } from 'react'
import { useMobileFirst } from '@/hooks/use-mobile-first'

// Critical CSS for mobile casino pages
export const mobileCriticalCSS = `
  /* Critical CSS for mobile casino pages - Above the fold only */

  /* Reset and base styles - Critical for first paint */
  * {
    box-sizing: border-box;
  }

  html {
    font-size: 14px;
    line-height: 1.4;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #000000;
    color: #ffffff;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* Critical for mobile performance */
    overflow-x: hidden;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }

  /* Critical layout components - Must load first */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Glass card critical styles - Core component */
  .glass-card {
    backdrop-filter: blur(16px);
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    /* GPU acceleration for smooth scrolling */
    transform: translateZ(0);
    will-change: transform;
  }

  /* Hero section critical styles - Above the fold */
  .hero-section {
    position: relative;
    min-height: 60vh;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem 1rem;
    /* Critical for LCP */
    contain: layout style paint;
  }

  .hero-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    /* Font loading optimization */
    font-display: swap;
  }

  .hero-subtitle {
    font-size: 1rem;
    color: #cccccc;
    max-width: 600px;
    margin: 0 auto;
  }

  /* Casino card critical styles - Main content */
  .casino-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    /* Mobile-optimized interactions */
    transition: all 0.2s ease;
    transform: translateZ(0);
    will-change: transform, border-color;
  }

  .casino-card:hover {
    border-color: rgba(0, 255, 136, 0.3);
    transform: translateY(-2px);
  }

  .casino-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #ffffff;
    /* Font optimization */
    font-display: swap;
  }

  .casino-rating {
    display: inline-flex;
    align-items: center;
    background: rgba(0, 255, 136, 0.1);
    color: #00ff88;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    /* Touch target minimum 44px */
    min-height: 32px;
    min-width: 60px;
    align-items: center;
    justify-content: center;
  }

  .casino-description {
    color: #cccccc;
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0.5rem 0;
    /* Performance optimization */
    contain: layout style;
  }

  /* Button critical styles - Core interaction */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
    color: #000000;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    /* Mobile-optimized transitions */
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateZ(0);
    will-change: transform, box-shadow;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px rgba(0, 255, 136, 0.3);
  }

  .btn-primary:active {
    transform: translateY(0);
    box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
  }

  /* Navigation critical styles - Fixed header */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 1000;
    padding: 1rem;
    /* Performance optimization */
    contain: layout style paint;
    transform: translateZ(0);
  }

  .navbar-brand {
    font-size: 1.25rem;
    font-weight: 700;
    color: #00ff88;
    text-decoration: none;
    /* Font optimization */
    font-display: swap;
  }

  /* Filter section critical styles */
  .filter-section {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 2rem;
    /* Performance optimization */
    contain: layout style;
  }

  .filter-button {
    background: rgba(0, 255, 136, 0.1);
    color: #00ff88;
    border: 1px solid rgba(0, 255, 136, 0.3);
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    /* Touch target optimization */
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateZ(0);
    will-change: background-color, transform;
  }

  .filter-button.active {
    background: #00ff88;
    color: #000000;
  }

  .filter-button:active {
    transform: scale(0.95);
  }

  /* Loading states critical styles */
  .skeleton {
    background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 8px;
    /* GPU acceleration */
    transform: translateZ(0);
    will-change: background-position;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Mobile-specific optimizations - Critical */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 1.75rem;
    }

    .casino-card {
      padding: 1rem;
    }

    .btn-primary {
      width: 100%;
      padding: 0.875rem 1rem;
      /* Touch target optimization */
      min-height: 44px;
    }

    .container {
      padding: 0 0.75rem;
    }

    /* Optimize for mobile viewport */
    .hero-section {
      min-height: 50vh;
      padding: 1.5rem 0.75rem;
    }
  }

  /* Touch targets for mobile - Critical for accessibility */
  @media (hover: none) and (pointer: coarse) {
    .btn-primary,
    .filter-button,
    .casino-card {
      min-height: 44px;
      min-width: 44px;
      /* Improve touch accuracy */
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    /* Optimize for coarse pointers */
    button, a, input, select, textarea {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* Performance optimizations - Critical for mobile */
  .will-change-transform {
    will-change: transform;
  }

  .gpu-accelerated {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  /* Content visibility for performance */
  .content-visibility-auto {
    content-visibility: auto;
    contain-intrinsic-size: 200px;
  }

  /* Font loading optimization */
  .font-optimized {
    font-display: swap;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  /* Reduce paint and layout shifts */
  .stable-layout {
    contain: layout style paint;
  }

  /* Optimize scrolling performance */
  .scroll-optimized {
    overflow-anchor: none;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  /* Image optimization */
  .image-optimized {
    content-visibility: auto;
    contain-intrinsic-size: 300px 200px;
  }

  /* Critical for mobile: prevent horizontal scroll */
  .no-horizontal-scroll {
    overflow-x: hidden;
    max-width: 100vw;
  }
`

// Critical CSS for specific page types
export const pageCriticalCSS = {
  casinos: `
    /* Casinos page specific critical CSS */
    .casino-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin: 2rem 0;
      /* Performance optimization */
      contain: layout style;
    }

    .search-container {
      position: sticky;
      top: 80px;
      z-index: 100;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1rem 0;
      /* Performance optimization */
      transform: translateZ(0);
      contain: layout style paint;
    }

    .filter-bar {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      /* Mobile-optimized scrolling */
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    .filter-bar::-webkit-scrollbar {
      display: none;
    }

    @media (max-width: 768px) {
      .casino-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
        margin: 1rem 0;
      }

      .search-container {
        top: 70px;
        padding: 0.75rem 0;
      }
    }

    @media (min-width: 640px) {
      .casino-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }
    }

    @media (min-width: 1024px) {
      .casino-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `,

  home: `
    /* Home page specific critical CSS */
    .hero-banner {
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      /* Performance optimization */
      contain: layout style paint;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin: 4rem 0;
      /* Performance optimization */
      contain: layout style;
    }

    .hero-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
      color: #000000;
      padding: 1rem 2rem;
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 600;
      text-decoration: none;
      /* Mobile optimization */
      min-height: 56px;
      min-width: 200px;
      transform: translateZ(0);
      will-change: transform, box-shadow;
    }

    @media (max-width: 768px) {
      .hero-cta {
        width: 100%;
        max-width: 300px;
        margin: 0 auto;
        padding: 0.875rem 1.5rem;
        font-size: 1rem;
      }

      .feature-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin: 2rem 0;
      }
    }
  `,

  bonuses: `
    /* Bonuses page specific critical CSS */
    .bonus-card {
      background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 204, 102, 0.1) 100%);
      border: 1px solid rgba(0, 255, 136, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      /* Performance optimization */
      transform: translateZ(0);
      will-change: transform, border-color;
    }

    .bonus-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin: 2rem 0;
      /* Performance optimization */
      contain: layout style;
    }

    .bonus-amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #00ff88;
      margin-bottom: 0.5rem;
      /* Font optimization */
      font-display: swap;
    }

    .bonus-type {
      display: inline-flex;
      align-items: center;
      background: rgba(0, 255, 136, 0.1);
      color: #00ff88;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      /* Touch target optimization */
      min-height: 32px;
    }

    @media (max-width: 768px) {
      .bonus-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
        margin: 1rem 0;
      }

      .bonus-card {
        padding: 1rem;
      }

      .bonus-amount {
        font-size: 1.25rem;
      }
    }

    @media (min-width: 640px) {
      .bonus-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }
    }
  `,

  reviews: `
    /* Reviews page specific critical CSS */
    .review-card {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      /* Performance optimization */
      transform: translateZ(0);
      contain: layout style;
    }

    .review-rating {
      display: inline-flex;
      align-items: center;
      background: rgba(0, 255, 136, 0.1);
      color: #00ff88;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      /* Touch target optimization */
      min-height: 32px;
      min-width: 60px;
      align-items: center;
      justify-content: center;
    }

    .review-content {
      color: #cccccc;
      font-size: 0.875rem;
      line-height: 1.4;
      margin: 1rem 0;
    }

    .review-author {
      color: #888888;
      font-size: 0.75rem;
      margin-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 1rem;
    }

    @media (max-width: 768px) {
      .review-card {
        padding: 1rem;
      }

      .review-content {
        font-size: 0.8125rem;
      }
    }
  `
}

// Utility functions for critical CSS management
export class CriticalCSSManager {
  private static instance: CriticalCSSManager
  private injectedCSS = new Set<string>()

  static getInstance(): CriticalCSSManager {
    if (!CriticalCSSManager.instance) {
      CriticalCSSManager.instance = new CriticalCSSManager()
    }
    return CriticalCSSManager.instance
  }

  // Inject critical CSS into document head
  injectCriticalCSS(css: string, id?: string): void {
    if (typeof document === 'undefined') return

    const styleId = id || `critical-css-${Date.now()}`

    // Skip if already injected
    if (this.injectedCSS.has(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = css
    style.setAttribute('data-critical', 'true')

    // Insert at the beginning of head for highest priority
    const firstStyle = document.head.querySelector('style')
    if (firstStyle) {
      document.head.insertBefore(style, firstStyle)
    } else {
      document.head.appendChild(style)
    }

    this.injectedCSS.add(styleId)
  }

  // Remove critical CSS after page load
  removeCriticalCSS(id?: string): void {
    if (typeof document === 'undefined') return

    if (id) {
      const style = document.getElementById(id)
      if (style) {
        document.head.removeChild(style)
        this.injectedCSS.delete(id)
      }
    } else {
      // Remove all critical CSS
      document.querySelectorAll('style[data-critical]').forEach(style => {
        document.head.removeChild(style)
        this.injectedCSS.delete(style.id)
      })
    }
  }

  // Generate page-specific critical CSS
  generatePageCriticalCSS(pageType: keyof typeof pageCriticalCSS, isMobile: boolean): string {
    let css = mobileCriticalCSS

    // Add page-specific CSS
    if (pageCriticalCSS[pageType]) {
      css += pageCriticalCSS[pageType]
    }

    // Add mobile-specific optimizations
    if (isMobile) {
      css += `
        /* Mobile-specific critical CSS optimizations */
        * {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .scroll-smooth {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        .casino-card {
          transform: translateZ(0);
          will-change: transform;
        }
      `
    }

    return css
  }

  // Preload critical resources
  preloadCriticalResources(resources: Array<{ href: string; as: string; type?: string }>): void {
    if (typeof document === 'undefined') return

    resources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.href
      link.as = resource.as

      if (resource.type) {
        link.type = resource.type
      }

      // Add crossorigin for external resources
      if (resource.href.startsWith('http') && !resource.href.includes(window.location.hostname)) {
        link.crossOrigin = 'anonymous'
      }

      document.head.appendChild(link)
    })
  }

  // Lazy load non-critical CSS
  lazyLoadCSS(href: string, media = 'all'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.media = 'print' // Initially set to print to avoid blocking

      link.onload = () => {
        link.media = media
        resolve()
      }

      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`))

      document.head.appendChild(link)
    })
  }
}

// Hook for using critical CSS in components
export function useCriticalCSS() {
  const { isMobile } = useMobileFirst()
  const cssManager = CriticalCSSManager.getInstance()

  const injectPageCriticalCSS = (pageType: keyof typeof pageCriticalCSS) => {
    const criticalCSS = cssManager.generatePageCriticalCSS(pageType, isMobile)
    cssManager.injectCriticalCSS(criticalCSS, `page-${pageType}-critical`)
  }

  const preloadResources = (resources: Array<{ href: string; as: string; type?: string }>) => {
    cssManager.preloadCriticalResources(resources)
  }

  const lazyLoadCSS = (href: string, media?: string) => {
    return cssManager.lazyLoadCSS(href, media)
  }

  const cleanupCriticalCSS = (pageType?: string) => {
    if (pageType) {
      cssManager.removeCriticalCSS(`page-${pageType}-critical`)
    } else {
      cssManager.removeCriticalCSS()
    }
  }

  return {
    injectPageCriticalCSS,
    preloadResources,
    lazyLoadCSS,
    cleanupCriticalCSS
  }
}

// Performance monitoring for critical CSS
export function useCriticalCSSPerformance() {
  const [metrics, setMetrics] = useState({
    cssInjected: false,
    injectionTime: 0,
    resourcesPreloaded: 0,
    preloadTime: 0
  })

  const trackCSSInjection = (pageType: string, startTime: number) => {
    const injectionTime = performance.now() - startTime
    setMetrics(prev => ({
      ...prev,
      cssInjected: true,
      injectionTime
    }))

    // Track with analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'critical_css_injection', {
        event_category: 'Performance',
        event_label: pageType,
        value: Math.round(injectionTime),
        custom_parameter_1: 'success'
      })
    }
  }

  const trackResourcePreload = (resourceCount: number, startTime: number) => {
    const preloadTime = performance.now() - startTime
    setMetrics(prev => ({
      ...prev,
      resourcesPreloaded: resourceCount,
      preloadTime
    }))

    // Track with analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resource_preload', {
        event_category: 'Performance',
        event_label: 'critical_resources',
        value: Math.round(preloadTime),
        custom_parameter_1: resourceCount.toString()
      })
    }
  }

  return {
    metrics,
    trackCSSInjection,
    trackResourcePreload
  }
}
