"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useMobileFirst } from './use-mobile-first'
import { trackEvent } from '@/lib/analytics'

// Touch gesture types
export type GestureType = 'swipe' | 'tap' | 'double-tap' | 'long-press' | 'pull-to-refresh'

export interface TouchPosition {
  x: number
  y: number
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

export interface GestureConfig {
  minSwipeDistance: number
  maxSwipeTime: number
  longPressDelay: number
  doubleTapDelay: number
  enableHaptic: boolean
  enableVibration: boolean
}

const defaultConfig: GestureConfig = {
  minSwipeDistance: 50,
  maxSwipeTime: 300,
  longPressDelay: 500,
  doubleTapDelay: 300,
  enableHaptic: true,
  enableVibration: true
}

export function useMobileGestures(config: Partial<GestureConfig> = {}) {
  const { isMobile } = useMobileFirst()
  const finalConfig = { ...defaultConfig, ...config }

  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const touchStartRef = useRef<TouchPosition>({ x: 0, y: 0 })
  const touchStartTimeRef = useRef<number>(0)
  const elementRef = useRef<HTMLElement | null>(null)

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!finalConfig.enableHaptic || !isMobile) return

    try {
      // Modern haptic feedback API
      if ('vibrate' in navigator && finalConfig.enableVibration) {
        const pattern = type === 'light' ? 50 : type === 'medium' ? 100 : 200
        navigator.vibrate(pattern)
      }

      // iOS haptic feedback (if available)
      if ('hapticFeedback' in navigator) {
        (navigator as any).hapticFeedback.impact({ style: type })
      }
    } catch (error) {
      console.warn('Haptic feedback not supported:', error)
    }
  }, [finalConfig.enableHaptic, finalConfig.enableVibration, isMobile])

  // Swipe gesture handler
  const handleSwipe = useCallback((gesture: SwipeGesture, element: HTMLElement) => {
    triggerHaptic('light')
    trackEvent({
      action: 'swipe_gesture',
      category: 'Mobile Interaction',
      label: gesture.direction,
      value: Math.round(gesture.distance),
      customParameters: {
        direction: gesture.direction,
        distance: gesture.distance,
        velocity: gesture.velocity,
        duration: gesture.duration,
        element: element.tagName
      }
    })

    // Dispatch custom event for components to listen
    const event = new CustomEvent('swipe', {
      detail: gesture,
      bubbles: true
    })
    element.dispatchEvent(event)
  }, [triggerHaptic])

  // Pull-to-refresh handler
  const handlePullToRefresh = useCallback((element: HTMLElement) => {
    triggerHaptic('medium')
    trackEvent({
      action: 'pull_to_refresh',
      category: 'Mobile Interaction',
      label: 'refresh_triggered',
      customParameters: {
        element: element.tagName,
        timestamp: Date.now()
      }
    })

    // Trigger refresh
    const event = new CustomEvent('pullToRefresh', {
      bubbles: true
    })
    element.dispatchEvent(event)

    // Reset pull state
    setIsPulling(false)
    setPullDistance(0)
  }, [triggerHaptic])

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return

    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    touchStartTimeRef.current = Date.now()

    // Handle pull-to-refresh (if at top of scrollable area)
    const target = e.target as HTMLElement
    const scrollable = target.closest('[data-pull-refresh]') as HTMLElement

    if (scrollable && scrollable.scrollTop === 0) {
      setIsPulling(true)
    }

    // Handle long press
    if (finalConfig.longPressDelay > 0) {
      const timer = setTimeout(() => {
        triggerHaptic('medium')
        const event = new CustomEvent('longPress', {
          detail: { x: touch.clientX, y: touch.clientY },
          bubbles: true
        })
        target.dispatchEvent(event)
      }, finalConfig.longPressDelay)
      setLongPressTimer(timer)
    }
  }, [finalConfig.longPressDelay, triggerHaptic])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling) return

    const touch = e.touches[0]
    if (!touch) return

    const distance = touch.clientY - touchStartRef.current.y
    if (distance > 0) {
      setPullDistance(distance)
      e.preventDefault() // Prevent default scrolling
    }
  }, [isPulling])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0]
    if (!touch) return

    const endTime = Date.now()
    const duration = endTime - touchStartTimeRef.current
    const distance = Math.sqrt(
      Math.pow(touch.clientX - touchStartRef.current.x, 2) +
      Math.pow(touch.clientY - touchStartRef.current.y, 2)
    )

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    // Handle pull-to-refresh
    if (isPulling && pullDistance > 80) {
      const target = e.target as HTMLElement
      const scrollable = target.closest('[data-pull-refresh]') as HTMLElement
      if (scrollable) {
        handlePullToRefresh(scrollable)
      }
      return
    }

    // Reset pull state
    setIsPulling(false)
    setPullDistance(0)

    // Handle swipe gesture
    if (duration < finalConfig.maxSwipeTime && distance > finalConfig.minSwipeDistance) {
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      let direction: SwipeGesture['direction'] = 'right'
      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }

      const velocity = distance / duration

      const gesture: SwipeGesture = {
        direction,
        distance,
        velocity,
        duration
      }

      const target = e.target as HTMLElement
      handleSwipe(gesture, target)
    }

    // Handle double tap
    const currentTime = Date.now()
    if (currentTime - lastTapTime < finalConfig.doubleTapDelay) {
      triggerHaptic('light')
      const target = e.target as HTMLElement
      const event = new CustomEvent('doubleTap', {
        detail: { x: touch.clientX, y: touch.clientY },
        bubbles: true
      })
      target.dispatchEvent(event)
    }
    setLastTapTime(currentTime)
  }, [
    isPulling,
    pullDistance,
    lastTapTime,
    finalConfig,
    longPressTimer,
    handleSwipe,
    handlePullToRefresh,
    triggerHaptic
  ])

  // Setup gesture listeners
  const setupGestures = useCallback((element: HTMLElement) => {
    elementRef.current = element

    if (!isMobile) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  return {
    setupGestures,
    isPulling,
    pullDistance,
    triggerHaptic,
    config: finalConfig
  }
}

// Specialized hook for casino card gestures
export function useCasinoCardGestures() {
  const { setupGestures, triggerHaptic } = useMobileGestures({
    minSwipeDistance: 30, // Shorter for cards
    maxSwipeTime: 200,
    enableHaptic: true
  })

  const handleCardSwipe = useCallback((gesture: SwipeGesture, casinoId: string) => {
    // Handle different swipe directions
    switch (gesture.direction) {
      case 'left':
        // Swipe left: Add to favorites or next card
        triggerHaptic('light')
        break
      case 'right':
        // Swipe right: View details or previous card
        triggerHaptic('light')
        break
      case 'up':
        // Swipe up: Quick view or share
        triggerHaptic('medium')
        break
      case 'down':
        // Swipe down: Dismiss or hide
        triggerHaptic('medium')
        break
    }

    trackEvent({
      action: 'casino_card_swipe',
      category: 'Mobile Interaction',
      label: gesture.direction,
      value: Math.round(gesture.distance),
      customParameters: {
        casino_id: casinoId,
        direction: gesture.direction,
        velocity: gesture.velocity
      }
    })
  }, [triggerHaptic])

  return {
    setupGestures,
    handleCardSwipe,
    triggerHaptic
  }
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const { setupGestures, isPulling, pullDistance } = useMobileGestures({
    enableHaptic: true
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const handlePullToRefresh = async () => {
      if (isPulling && pullDistance > 80 && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
    }

    const element = document.querySelector('[data-pull-refresh]')
    if (element) {
      element.addEventListener('pullToRefresh', handlePullToRefresh)
      return () => {
        element.removeEventListener('pullToRefresh', handlePullToRefresh)
      }
    }
  }, [isPulling, pullDistance, onRefresh, isRefreshing])

  return {
    setupGestures,
    isPulling,
    pullDistance,
    isRefreshing
  }
}

// Hook for swipe navigation
export function useSwipeNavigation() {
  const { setupGestures } = useMobileGestures({
    minSwipeDistance: 100,
    maxSwipeTime: 300,
    enableHaptic: true
  })

  const handleSwipe = useCallback((gesture: SwipeGesture) => {
    // Implement navigation logic
    if (gesture.direction === 'left') {
      // Navigate to next page
      window.history.forward()
    } else if (gesture.direction === 'right') {
      // Navigate to previous page
      window.history.back()
    }
  }, [])

  useEffect(() => {
    const element = document.querySelector('[data-swipe-nav]') as HTMLElement
    if (element) {
      const cleanup = setupGestures(element)

      const handleSwipeEvent = (e: Event) => {
        const customEvent = e as CustomEvent
        handleSwipe(customEvent.detail)
      }

      element.addEventListener('swipe', handleSwipeEvent)
      return () => {
        cleanup?.()
        element.removeEventListener('swipe', handleSwipeEvent)
      }
    }
  }, [setupGestures, handleSwipe])

  return { setupGestures }
}
