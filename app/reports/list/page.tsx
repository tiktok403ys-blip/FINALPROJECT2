"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from '@/components/glass-card'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Flag, ShieldAlert, Search as SearchIcon, X as XIcon } from 'lucide-react'

type ListItem = {
  id: string
  casino_name: string
  status: 'scam' | 'suspicious'
}

export default function ReportsListPage() {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [search, setSearch] = useState('')

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
    s === 'scam' ? <ShieldAlert className="w-5 h-5" /> : <Flag className="w-5 h-5" />

  const statusLabel = (s: ListItem['status']) => (s.charAt(0).toUpperCase() + s.slice(1))

  const accentBorder = (s: ListItem['status']) =>
    s === 'scam' ? 'border-l-red-500' : 'border-l-yellow-400'

  const gradientBg = (s: ListItem['status']) =>
    s === 'scam' ? 'from-red-500/10 via-transparent to-transparent' : 'from-yellow-400/10 via-transparent to-transparent'

  const ringStyle = (s: ListItem['status']) =>
    s === 'scam' ? 'ring-red-500/30 text-red-400' : 'ring-yellow-400/30 text-yellow-300'

  const normalized = search.trim().toLowerCase()
  const filteredItems = normalized
    ? items.filter(i =>
        (i.casino_name || '').toLowerCase().includes(normalized) ||
        (i.status || '').toLowerCase().includes(normalized)
      )
    : items

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
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <SearchIcon className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by casino or status (scam/suspicious)"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                aria-label="Clear search"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          {!loading && (
            <div className="text-xs text-white/50 mt-2">
              Showing {filteredItems.length} of {items.length}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && (
            <GlassCard className="p-6 text-white/70">Loading...</GlassCard>
          )}

          {!loading && filteredItems.map((item) => (
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
                  <Badge className={`${statusStyles(item.status)} flex items-center gap-1.5 px-3 py-1.5`}>
                    {statusIcon(item.status)}
                    {statusLabel(item.status)}
                  </Badge>
                </div>
              </div>
            </GlassCard>
          ))}

          {!loading && filteredItems.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-gray-400">No matching results. Try another keyword or clear the search.</p>
            </GlassCard>
          )}
        </div>

        {/* Hard-coded informational content about Scam vs Suspicious */}
        <div className="mt-12 grid lg:grid-cols-2 gap-4">
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Understanding Risk Labels</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="font-semibold">Scam (High Risk)</span>
                </div>
                <ul className="text-sm text-red-200/90 space-y-1 list-disc list-inside">
                  <li>Confirmed abusive behavior (e.g., non-payment, identity misuse).</li>
                  <li>Refusal to cooperate or systematic unfair terms.</li>
                  <li>Very high chance of losing funds and data.</li>
                </ul>
                <div className="mt-3 text-sm text-red-200/90">
                  <span className="font-semibold">Action:</span> Do not deposit or share documents. Report immediately.
                </div>
              </div>

              <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-4">
                <div className="flex items-center gap-2 mb-2 text-yellow-300">
                  <Flag className="w-5 h-5" />
                  <span className="font-semibold">Suspicious (Medium Risk)</span>
                </div>
                <ul className="text-sm text-yellow-100/90 space-y-1 list-disc list-inside">
                  <li>Unresolved red flags (e.g., long KYC delays, clawbacks).</li>
                  <li>Inconsistent support or multiple unresolved complaints.</li>
                  <li>Funds may be at risk until clarified.</li>
                </ul>
                <div className="mt-3 text-sm text-yellow-100/90">
                  <span className="font-semibold">Action:</span> If you must play, keep balances small, document everything, and test withdrawals early.
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Safety Notice</h3>
            <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
              <li>Never send money outside official cashier pages or to private wallets.</li>
              <li>Avoid “too good to be true” bonuses or unsolicited messages.</li>
              <li>Use unique strong passwords and enable 2FA when available.</li>
              <li>If harmed or pressured, file a report so we can investigate.</li>
            </ul>
          </GlassCard>
        </div>
      </div>

      <Footer />
    </div>
  )
}


