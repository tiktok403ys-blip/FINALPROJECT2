"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface AlertItem {
  id: string
  text: string
  href: string | null
}

export function TopAlertTicker() {
  const supabase = createClient()
  const [items, setItems] = useState<AlertItem[]>([])
  const [idx, setIdx] = useState(0)
  const [enabled, setEnabled] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLSpanElement | null>(null)
  const [durationSec, setDurationSec] = useState(14)
  const [fromPx, setFromPx] = useState(0)
  const [toPx, setToPx] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [animVersion, setAnimVersion] = useState(0)
  const [animate, setAnimate] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [pageHidden, setPageHidden] = useState(false)
  const progressTimerRef = useRef<number | null>(null)
  const lastDimsRef = useRef<{ containerWidth: number; contentWidth: number }>({ containerWidth: 0, contentWidth: 0 })

  // Selalu aktifkan animasi (mengabaikan prefers-reduced-motion sesuai permintaan)
  useEffect(() => { setEnabled(true) }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase
        .from('home_alerts')
        .select('id, text, href')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (!active) return
      setItems((data as any[])?.map(d => ({ id: d.id, text: d.text, href: d.href })) || [])
    })()
    return () => { active = false }
  }, [supabase])

  // Observe visibility to start when ticker enters viewport (ensure ref exists)
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => setIsVisible(e.isIntersecting))
    }, { threshold: 0, root: null, rootMargin: '0px' })
    obs.observe(node)
    return () => obs.disconnect()
  }, [items, idx])

  // Pause when tab is hidden; resume when visible
  useEffect(() => {
    const handleVis = () => {
      if (typeof document !== 'undefined') {
        setPageHidden(document.hidden)
      }
    }
    handleVis()
    document.addEventListener('visibilitychange', handleVis)
    return () => document.removeEventListener('visibilitychange', handleVis)
  }, [])

  // Fallback: jika visibilitas tidak terdeteksi, tetap ukur & mulai animasi setelah sedikit penundaan
  useEffect(() => {
    if (!enabled) return
    const c = containerRef.current
    const t = textRef.current
    if (!c || !t) return
    const runMeasure = () => {
      const containerWidth = c.clientWidth
      const contentWidth = t.scrollWidth
      if (containerWidth === 0 || contentWidth === 0) return
      const needRestart =
        lastDimsRef.current.containerWidth !== containerWidth ||
        lastDimsRef.current.contentWidth !== contentWidth
      lastDimsRef.current = { containerWidth, contentWidth }
      if (!needRestart) return
      const start = containerWidth
      const end = -contentWidth
      setFromPx(start)
      setToPx(end)
      const distance = start - end
      const pxPerSec = 26
      const d = Math.max(8, Math.ceil(distance / pxPerSec))
      setDurationSec(d)
      setAnimate(false)
      /* eslint-disable-next-line no-unused-expressions */
      c.offsetWidth
      requestAnimationFrame(() => {
        setAnimate(true)
        setAnimVersion(v => v + 1)
      })
    }
    const tm = setTimeout(() => {
      if (!isVisible && !animate) {
        runMeasure()
      }
    }, 400)
    // Re-measure setelah webfonts siap (jika tersedia)
    // @ts-ignore
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      // @ts-ignore
      ;(document as any).fonts.ready.then(() => {
        if (!animate) runMeasure()
      })
    }
    return () => clearTimeout(tm)
  }, [enabled, isVisible, animate, idx])

  // Recompute animation distance and duration per item & on resize (debounced 80ms).
  // Important: do NOT tie to visibility changes to avoid resetting position on resume
  useEffect(() => {
    if (!enabled) return
    const measure = () => {
      const c = containerRef.current
      const t = textRef.current
      if (!c || !t) return
      const containerWidth = c.clientWidth
      const contentWidth = t.scrollWidth
      const needRestart =
        lastDimsRef.current.containerWidth !== containerWidth ||
        lastDimsRef.current.contentWidth !== contentWidth
      lastDimsRef.current = { containerWidth, contentWidth }
      if (!needRestart) return
      const start = containerWidth // start just outside the right edge
      const end = -contentWidth // finish outside the left edge
      setFromPx(start)
      setToPx(end)
      const distance = start - end // total px to travel
      const pxPerSec = 26 // slightly faster but still smooth
      const d = Math.max(8, Math.ceil(distance / pxPerSec))
      setDurationSec(d)
      // Restart animation after measurement with latest CSS vars
      setAnimate(false)
      /* eslint-disable-next-line no-unused-expressions */
      c.offsetWidth
      requestAnimationFrame(() => {
        setAnimate(true)
        setAnimVersion(v => v + 1)
      })
    }
    // ukur setelah paint agar layout sudah stabil
    const raf = requestAnimationFrame(measure)
    let debounceId: number | null = null
    const scheduleMeasure = () => {
      if (debounceId) {
        clearTimeout(debounceId)
        debounceId = null
      }
      debounceId = window.setTimeout(() => {
        measure()
      }, 80)
    }
    window.addEventListener('resize', scheduleMeasure)
    window.addEventListener('orientationchange', scheduleMeasure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', scheduleMeasure)
      window.removeEventListener('orientationchange', scheduleMeasure)
      if (debounceId) clearTimeout(debounceId)
    }
  }, [idx, enabled])

  // Advance to next item when animation completes (fallback timer)
  useEffect(() => {
    if (!enabled || items.length <= 1) return
    const paused = isPaused || pageHidden || !isVisible
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current)
      progressTimerRef.current = null
    }
    if (paused) {
      return
    }
    const t = window.setTimeout(() => {
      progressTimerRef.current = null
      setIdx(i => (i + 1) % items.length)
    }, (durationSec + 0.5) * 1000)
    progressTimerRef.current = t
    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }
  }, [durationSec, items.length, enabled, isPaused, pageHidden, isVisible])

  // Prefer reliable progression via animationend (with timeout as fallback)
  useEffect(() => {
    const node = animRef.current
    if (!node || items.length <= 1) return
    const handleEnd = () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current)
        progressTimerRef.current = null
      }
      setIdx(i => (i + 1) % items.length)
    }
    node.addEventListener('animationend', handleEnd)
    return () => { node.removeEventListener('animationend', handleEnd) }
  }, [items.length, animVersion])

  const current = useMemo(() => items[idx] || null, [items, idx])
  if (!current) return null

  return (
    <div className="w-full bg-[#0a0f0c] border-y border-[#00ff88]/20 text-[#00ff88]">
      <div className="container mx-auto px-0">
        <div ref={containerRef} className={`overflow-hidden relative h-6`} aria-live={enabled ? 'polite' : 'off'}>
          <div
            ref={animRef}
            key={`${current.id}-${idx}-${animVersion}`}
            className={`absolute top-0 left-0 flex items-center whitespace-nowrap will-change-transform ticker-anim ${animate && enabled ? 'ticker-anim-on' : ''} ${items.length > 1 ? 'ticker-once' : 'ticker-infinite'}`}
            style={{
              // custom props used inside keyframes
              // @ts-ignore - custom CSS props
              ['--from' as any]: `${fromPx}px`,
              ['--to' as any]: `${toPx}px`,
              ['--dur' as any]: `${durationSec}s`,
              animationPlayState: (isPaused || pageHidden || !isVisible) ? 'paused' : 'running'
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <span ref={textRef} className="px-4 inline-block">{current.text}</span>
          </div>
        </div>
      </div>
      {/* Accessible toggle for screen readers */}
      <button
        type="button"
        className="sr-only"
        aria-pressed={!isPaused}
        aria-label={isPaused ? 'Resume ticker' : 'Pause ticker'}
        onClick={() => setIsPaused(p => !p)}
      />
      <style jsx global>{`
        @keyframes ticker-slide {
          from { transform: translateX(var(--from)); }
          to { transform: translateX(var(--to)); }
        }
        /* Override reduce-motion global rule specifically for ticker */
        .ticker-anim { will-change: transform; transform: translateX(var(--from)); }
        .ticker-anim-on { animation-name: ticker-slide !important; animation-duration: var(--dur) !important; animation-timing-function: linear !important; animation-play-state: running !important; animation-fill-mode: both !important; }
        .ticker-anim-on:hover { animation-play-state: paused !important; }
        .ticker-once { animation-iteration-count: 1 !important; }
        .ticker-infinite { animation-iteration-count: infinite !important; }
        @media (prefers-reduced-motion: reduce) {
          .ticker-anim-on { animation-duration: var(--dur) !important; }
        }
      `}</style>
    </div>
  )
}

export default TopAlertTicker


