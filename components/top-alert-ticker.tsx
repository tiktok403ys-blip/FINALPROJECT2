"use client"

import { useEffect, useMemo, useState } from "react"
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

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
    setEnabled(!rm.matches)
    const onChange = () => setEnabled(!rm.matches)
    rm.addEventListener?.('change', onChange)
    return () => rm.removeEventListener?.('change', onChange)
  }, [])

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

  useEffect(() => {
    if (!enabled || items.length <= 1) return
    const timer = setInterval(() => setIdx(i => (i + 1) % items.length), 4000)
    return () => clearInterval(timer)
  }, [items.length, enabled])

  const current = useMemo(() => items[idx] || null, [items, idx])
  if (!current) return null

  return (
    <div className="w-full bg-[#0a0f0c] border-y border-[#00ff88]/20 text-[#00ff88]">
      <div className="container mx-auto px-0">
        <div className={`overflow-hidden relative h-6`} aria-live={enabled ? 'polite' : 'off'}>
          <div
            key={current.id}
            className="whitespace-nowrap absolute inset-0 flex items-center"
            style={{
              transform: enabled ? 'translateX(0)' : 'none',
              animation: enabled ? 'ticker-slide 8s linear infinite' : 'none'
            }}
          >
            {current.href ? (
              <Link href={current.href} className="px-4 inline-block underline-offset-4 hover:underline">
                {current.text}
              </Link>
            ) : (
              <span className="px-4 inline-block">{current.text}</span>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes ticker-slide {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}

export default TopAlertTicker


