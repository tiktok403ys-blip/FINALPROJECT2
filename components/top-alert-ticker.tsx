"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
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
  const textRef = useRef<HTMLSpanElement | null>(null)
  const [durationSec, setDurationSec] = useState(14)
  const [fromPx, setFromPx] = useState(0)
  const [toPx, setToPx] = useState(0)

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

  // Recompute animation distance and duration per item & on resize
  useEffect(() => {
    if (!enabled) return
    const measure = () => {
      const c = containerRef.current
      const t = textRef.current
      if (!c || !t) return
      const containerWidth = c.clientWidth
      const contentWidth = t.scrollWidth
      const start = containerWidth // start just outside the right edge
      const end = -contentWidth // finish outside the left edge
      setFromPx(start)
      setToPx(end)
      const distance = start - end // total px to travel
      const pxPerSec = 22 // slower target speed
      const d = Math.max(8, Math.ceil(distance / pxPerSec))
      setDurationSec(d)
    }
    // ukur setelah paint agar layout sudah stabil
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure) }
  }, [idx, enabled])

  // Advance to next item when animation completes
  useEffect(() => {
    if (!enabled || items.length <= 1) return
    const t = setTimeout(() => setIdx(i => (i + 1) % items.length), (durationSec + 0.5) * 1000)
    return () => clearTimeout(t)
  }, [durationSec, items.length, enabled])

  const current = useMemo(() => items[idx] || null, [items, idx])
  if (!current) return null

  return (
    <div className="w-full bg-[#0a0f0c] border-y border-[#00ff88]/20 text-[#00ff88]">
      <div className="container mx-auto px-0">
        <div ref={containerRef} className={`overflow-hidden relative h-6`} aria-live={enabled ? 'polite' : 'off'}>
          <div
            key={`${current.id}-${idx}`}
            className="absolute inset-0 flex items-center"
            style={{
              animation: enabled ? 'ticker-slide var(--dur) linear 1' : 'none',
              // custom props used inside keyframes
              // @ts-ignore - custom CSS props
              ['--from' as any]: `${fromPx}px`,
              ['--to' as any]: `${toPx}px`,
              ['--dur' as any]: `${durationSec}s`
            }}
          >
            {current.href ? (
              <Link href={current.href} className="px-4 inline-block underline-offset-4 hover:underline">
                <span ref={textRef}>{current.text}</span>
              </Link>
            ) : (
              <span ref={textRef} className="px-4 inline-block">{current.text}</span>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes ticker-slide {
          from { transform: translateX(var(--from)); }
          to { transform: translateX(var(--to)); }
        }
      `}</style>
    </div>
  )
}

export default TopAlertTicker


