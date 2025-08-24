"use client"

import { useState, useEffect } from 'react'
import { MOBILE_FIRST_CONFIG } from '@/lib/mobile-first-config'

export function useMobileFirst() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('mobile')
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth

      const newIsMobile = width < MOBILE_FIRST_CONFIG.breakpoints.tablet
      const newIsTablet = width >= MOBILE_FIRST_CONFIG.breakpoints.tablet && width < MOBILE_FIRST_CONFIG.breakpoints.desktop
      const newIsDesktop = width >= MOBILE_FIRST_CONFIG.breakpoints.desktop

      setIsMobile(newIsMobile)
      setIsTablet(newIsTablet)
      setIsDesktop(newIsDesktop)

      if (newIsMobile) setCurrentBreakpoint('mobile')
      else if (newIsTablet) setCurrentBreakpoint('tablet')
      else if (newIsDesktop && width < MOBILE_FIRST_CONFIG.breakpoints.wide) setCurrentBreakpoint('desktop')
      else setCurrentBreakpoint('wide')
    }

    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement)
      const top = parseFloat(style.getPropertyValue('--safe-area-inset-top') || '0')
      const bottom = parseFloat(style.getPropertyValue('--safe-area-inset-bottom') || '0')
      const left = parseFloat(style.getPropertyValue('--safe-area-inset-left') || '0')
      const right = parseFloat(style.getPropertyValue('--safe-area-inset-right') || '0')

      setSafeAreaInsets({ top, bottom, left, right })
    }

    // Initial check
    updateBreakpoint()
    updateSafeArea()

    // Listen for resize
    window.addEventListener('resize', updateBreakpoint)
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        updateBreakpoint()
        updateSafeArea()
      }, 100)
    })

    return () => {
      window.removeEventListener('resize', updateBreakpoint)
      window.removeEventListener('orientationchange', updateBreakpoint)
    }
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    safeAreaInsets,
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
    },
  }
}

// Hook for touch device detection
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      )
    }

    checkTouchDevice()
  }, [])

  return isTouchDevice
}

// Hook for safe area handling
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: '1rem',
    bottom: '1rem',
    left: '0.75rem',
    right: '0.75rem',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement)

      setSafeArea({
        top: `max(1rem, ${style.getPropertyValue('--safe-area-inset-top') || '0px'})`,
        bottom: `max(1rem, ${style.getPropertyValue('--safe-area-inset-bottom') || '0px'})`,
        left: `max(0.75rem, ${style.getPropertyValue('--safe-area-inset-left') || '0px'})`,
        right: `max(0.75rem, ${style.getPropertyValue('--safe-area-inset-right') || '0px'})`,
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)

    return () => window.removeEventListener('resize', updateSafeArea)
  }, [])

  return safeArea
}

// Hook for prefers reduced motion
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Hook for glass effect classes
export function useGlassEffect(variant: keyof typeof MOBILE_FIRST_CONFIG.colors.glass = 'primary') {
  const config = MOBILE_FIRST_CONFIG.colors.glass[variant]

  return {
    className: `backdrop-filter backdrop-blur-xl saturate-180`,
    style: {
      background: config.background,
      border: `1px solid ${config.border}`,
      boxShadow: `${MOBILE_FIRST_CONFIG.glass.shadow.primary}, ${MOBILE_FIRST_CONFIG.glass.shadow.border}, ${MOBILE_FIRST_CONFIG.glass.shadow.inset}`,
    },
  }
}
