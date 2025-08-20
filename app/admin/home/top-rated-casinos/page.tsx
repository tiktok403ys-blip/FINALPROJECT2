"use client"

import { useEffect, useMemo } from "react"
import { useCrud, type UseCrudReturn } from "@/hooks/use-crud"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { DashboardSkeleton } from "@/components/admin/loading-skeleton"

interface AdminCasinoItem {
  id: string
  name: string
  logo_url: string | null
  rating: number | null
  is_featured_home: boolean | null
  home_rank: number | null
}

export default function TopRatedCasinosAdminPage() {
  const config = useMemo(() => ({
    table: "casinos",
    columns: "id,name,logo_url,rating,is_featured_home,home_rank",
    orderBy: { column: "home_rank", ascending: true as const },
    realtime: true,
    pageSize: 50,
  }), [])

  const [state, actions]: UseCrudReturn<AdminCasinoItem> = useCrud<AdminCasinoItem>(config)

  // Derived lists
  const featured = useMemo(() => state.items.filter(c => c.is_featured_home).sort((a, b) => (a.home_rank ?? 999) - (b.home_rank ?? 999)), [state.items])
  const others = useMemo(() => state.items.filter(c => !c.is_featured_home), [state.items])

  const { fetchItems } = actions
  useEffect(() => {
    void fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleFeatured = async (casino: AdminCasinoItem) => {
    const updated = await actions.updateItem(casino.id, {
      is_featured_home: !casino.is_featured_home,
      // If turning on, set a default rank
      home_rank: !casino.is_featured_home ? (featured.length + 1) : null,
    })
    if (updated) toast.success("Updated")
  }

  const updateRank = async (casino: AdminCasinoItem, rank: number) => {
    const updated = await actions.updateItem(casino.id, { home_rank: rank })
    if (updated) toast.success("Rank updated")
  }

  if (state.loading && state.items.length === 0) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Top Rated Casinos (Home)</h1>
        <p className="text-white/60">Curate which casinos appear on the Home page and set their order.</p>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Featured on Home</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((casino) => (
            <div key={casino.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold truncate mr-3">{casino.name}</div>
                <div className="text-white/60 text-sm">Rating: {casino.rating ?? "-"}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`rank-${casino.id}`} className="text-white/80">Order</Label>
                  <Input
                    id={`rank-${casino.id}`}
                    type="number"
                    className="w-24"
                    value={casino.home_rank ?? 1}
                    onChange={(e) => updateRank(casino, Number(e.target.value))}
                    min={1}
                  />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Label htmlFor={`feat-${casino.id}`} className="text-white/80">Featured</Label>
                  <Switch id={`feat-${casino.id}`} checked={!!casino.is_featured_home} onCheckedChange={() => toggleFeatured(casino)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Other Casinos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {others.map((casino) => (
            <div key={casino.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold truncate mr-3">{casino.name}</div>
                <div className="text-white/60 text-sm">Rating: {casino.rating ?? "-"}</div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent"
                  onClick={() => toggleFeatured(casino)}>
                  Feature on Home
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}


