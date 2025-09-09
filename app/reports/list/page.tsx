"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from '@/components/glass-card'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Flag, ShieldAlert } from 'lucide-react'

type ListItem = {
  id: string
  casino_name: string
  status: 'scam' | 'suspicious'
}

export default function ReportsListPage() {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const fetchList = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reports-list', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.success) {
        setItems(Array.isArray(json.data) ? json.data : [])
      } else {
        setItems([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()

    const supabase = createClient()
    const ch = supabase
      .channel('reports-list-public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports_list_public' }, async () => {
        await fetchList()
      })
      .subscribe()

    setChannel(ch)
    return () => {
      if (ch) supabase.removeChannel(ch)
    }
  }, [])

  const statusStyles = (s: ListItem['status']) =>
    s === 'scam'
      ? 'bg-red-500 text-white border-red-400/40'
      : 'bg-yellow-500 text-white border-yellow-400/40'

  const statusIcon = (s: ListItem['status']) =>
    s === 'scam' ? <ShieldAlert className="w-4 h-4 mr-1.5" /> : <Flag className="w-4 h-4 mr-1.5" />

  const statusLabel = (s: ListItem['status']) => (s.charAt(0).toUpperCase() + s.slice(1))

  const accentBorder = (s: ListItem['status']) =>
    s === 'scam' ? 'border-l-red-500' : 'border-l-yellow-400'

  const gradientBg = (s: ListItem['status']) =>
    s === 'scam' ? 'from-red-500/10 via-transparent to-transparent' : 'from-yellow-400/10 via-transparent to-transparent'

  const ringStyle = (s: ListItem['status']) =>
    s === 'scam' ? 'ring-red-500/30 text-red-400' : 'ring-yellow-400/30 text-yellow-300'

  return (
    <div className="min-h-screen bg-black">
      <DynamicPageHero
        pageName="reports"
        sectionType="hero"
        fallbackTitle="Public Reports List"
        fallbackDescription="Simple list of casinos with public risk statuses."
        breadcrumbs={[{ label: 'Reports' }, { label: 'List Report' }]}
        author={{ name: 'GuruSingapore Protection Team' }}
        date={new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
      />

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && (
            <GlassCard className="p-6 text-white/70">Loading...</GlassCard>
          )}

          {!loading && items.map((item) => (
            <GlassCard
              key={item.id}
              className={`relative overflow-hidden group p-5 md:p-6 border-l-4 ${accentBorder(item.status)} transition-transform hover:-translate-y-0.5`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${gradientBg(item.status)}`} />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center ring-1 ${ringStyle(item.status)} bg-white/5`}>
                    {statusIcon(item.status)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-base md:text-lg truncate">{item.casino_name}</div>
                    <div className="text-xs text-white/50 mt-0.5">Public Status</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${statusStyles(item.status)} flex items-center px-3 py-1.5`}>
                    {statusIcon(item.status)}
                    {statusLabel(item.status)}
                  </Badge>
                </div>
              </div>
            </GlassCard>
          ))}

          {!loading && items.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-gray-400">No data yet. This list will be populated via admin CRUD.</p>
            </GlassCard>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}


