"use client"

import { useEffect } from "react"

type MobileAutoSliderProps = {
  containerId: string
  intervalMs?: number
  resumeDelayMs?: number
}

export default function MobileAutoSlider({
  containerId,
  intervalMs = 5000,
  resumeDelayMs = 6000,
}: MobileAutoSliderProps) {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const isMobile = window.matchMedia("(max-width: 767px)")
    if (prefersReduced.matches || !isMobile.matches) return

    const container = document.getElementById(containerId)
    if (!container) return

    let interval: number | null = null
    let resumeTimer: number | null = null
    let pausedByUser = false
    let isAutoScrolling = false
    let direction: 1 | -1 = 1

    const items = () => Array.from(container.children).filter((n): n is HTMLElement => n instanceof HTMLElement)

    const start = () => {
      if (interval !== null) return
      interval = window.setInterval(() => {
        const els = items()
        if (els.length === 0) return
        const currentScroll = container.scrollLeft
        // Find current index based on nearest item
        let idx = 0
        let minDelta = Number.POSITIVE_INFINITY
        els.forEach((el, i) => {
          const delta = Math.abs(el.offsetLeft - currentScroll)
          if (delta < minDelta) {
            minDelta = delta
            idx = i
          }
        })
        // Compute next index with ping-pong behavior
        let nextIdx = idx + direction
        if (nextIdx >= els.length || nextIdx < 0) {
          direction = (direction === 1 ? -1 : 1)
          nextIdx = idx + direction
          // Clamp just in case
          if (nextIdx >= els.length) nextIdx = els.length - 1
          if (nextIdx < 0) nextIdx = 0
        }
        const next = els[nextIdx]
        isAutoScrolling = true
        container.scrollTo({ left: next.offsetLeft, behavior: 'smooth' })
        window.setTimeout(() => { isAutoScrolling = false }, 700)
      }, Math.max(2500, intervalMs))
    }

    const clear = () => {
      if (interval !== null) {
        window.clearInterval(interval)
        interval = null
      }
    }

    const scheduleResume = () => {
      if (resumeTimer !== null) window.clearTimeout(resumeTimer)
      resumeTimer = window.setTimeout(() => {
        pausedByUser = false
        start()
      }, Math.max(2000, resumeDelayMs))
    }

    const onUserInteract = () => {
      if (isAutoScrolling) return
      pausedByUser = true
      clear()
      scheduleResume()
    }

    const onVisibility = () => {
      if (document.hidden) {
        clear()
      } else if (!pausedByUser) {
        start()
      } else {
        scheduleResume()
      }
    }

    // Attach listeners on container only to reduce overhead
    const opts: AddEventListenerOptions = { passive: true }
    container.addEventListener('touchstart', onUserInteract, opts)
    container.addEventListener('mousedown', onUserInteract, opts)
    container.addEventListener('wheel', onUserInteract, opts)
    container.addEventListener('scroll', onUserInteract, opts)
    document.addEventListener('visibilitychange', onVisibility)

    start()

    return () => {
      clear()
      if (resumeTimer !== null) window.clearTimeout(resumeTimer)
      container.removeEventListener('touchstart', onUserInteract as any)
      container.removeEventListener('mousedown', onUserInteract as any)
      container.removeEventListener('wheel', onUserInteract as any)
      container.removeEventListener('scroll', onUserInteract as any)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [containerId, intervalMs, resumeDelayMs])

  return null
}


