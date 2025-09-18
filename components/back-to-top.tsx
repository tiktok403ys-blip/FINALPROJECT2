"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowUp } from "lucide-react"

export default function BackToTop() {
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handle = () => setReduced(media.matches)
    handle()
    media.addEventListener('change', handle)
    return () => media.removeEventListener('change', handle)
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > 400)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    if (reduced) {
      window.scrollTo(0, 0)
      return
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      window.scrollTo(0, 0)
    }
  }, [reduced])

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-4 md:right-6 z-50 rounded-full bg-[#00ff88] text-black shadow-lg border border-white/20 transition-all ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-3'
      } hover:bg-[#00e67a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
    >
      <div className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center">
        <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
      </div>
    </button>
  )
}


