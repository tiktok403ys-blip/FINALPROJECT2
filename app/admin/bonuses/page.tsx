"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { PaginationControls } from "@/components/admin/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/glass-card"
import { Gift, Plus, Search, Edit, Trash2 } from "lucide-react"
import { useAdminSecurity } from "@/components/admin-security-provider"

interface Bonus {
  id: string
  title: string
  bonus_amount: string | null
  bonus_type: string | null
  casino_id: string
  created_at: string
  casinos?: { name: string | null }
}

export default function AdminBonusesPage() {
  const supabase = createClient()
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 12
  const { logAdminAction } = useAdminSecurity()

  useEffect(() => {
    fetchBonuses()
  }, [page])

  useEffect(() => {
    const channel = supabase
      .channel("bonuses-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bonuses" }, () => {
        fetchBonuses()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchBonuses = async () => {
    setLoading(true)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data } = await supabase
      .from("bonuses")
      .select("*, casinos(name)")
      .order("created_at", { ascending: false })
      .range(from, to)
    setBonuses(data || [])
    setLoading(false)
  }

  const filtered = useMemo(
    () =>
      bonuses.filter(
        (b) => b.title.toLowerCase().includes(search.toLowerCase()) || (b.casinos?.name || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [bonuses, search],
  )

  const onDelete = async (id: string) => {
    if (!confirm("Delete this bonus?")) return
    await supabase.from("bonuses").delete().eq("id", id)
    await logAdminAction("delete", "bonuses", id, {})
    fetchBonuses()
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage Bonuses</h1>
          <p className="text-gray-400">Create and manage bonuses</p>
        </div>
        <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
          <Link href="/admin/bonuses/new">
            <Plus className="w-4 h-4 mr-2" /> Add Bonus
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400" placeholder="Search bonuses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading bonuses...</div>
        ) : filtered.length > 0 ? (
          filtered.map((b) => (
            <GlassCard key={b.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded text-xs">{b.casinos?.name || "Unknown"}</span>
                    {b.bonus_type && <span className="bg-white/10 text-gray-300 px-2 py-1 rounded text-xs">{b.bonus_type}</span>}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{b.title}</h3>
                  {b.bonus_amount && <p className="text-gray-400">Amount: {b.bonus_amount}</p>}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="border-[#00ff88] text-[#00ff88] bg-transparent">
                    <Link href={`/admin/bonuses/edit/${b.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10" onClick={() => onDelete(b.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            No bonuses found.
          </div>
        )}
        <PaginationControls page={page} setPage={setPage} disablePrev={page === 1} disableNext={filtered.length < pageSize} />
      </div>
    </div>
  )
}


