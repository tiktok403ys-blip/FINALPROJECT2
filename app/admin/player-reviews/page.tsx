"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PaginationControls } from "@/components/admin/pagination"
import { useAdminSecurity } from "@/components/admin-security-provider"
import { Eye, EyeOff, Search, Trash2, User, Star, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlayerReviewRow {
  id: string
  casino_id: string
  user_id: string | null
  reviewer_name: string | null
  title: string
  content: string
  rating: number | null
  game_variety_rating: number | null
  customer_service_rating: number | null
  payout_speed_rating: number | null
  helpful_count: number
  not_helpful_count: number
  is_approved: boolean
  created_at: string
  casinos?: { name: string | null }
}

export default function AdminPlayerReviewsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<PlayerReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "approved" | "pending">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "pending">("newest")
  const [page, setPage] = useState(1)
  const pageSize = 12
  const { logAdminAction } = useAdminSecurity()
  const { toast } = useToast()

  useEffect(() => {
    fetchRows()
  }, [page])

  useEffect(() => {
    const channel = supabase
      .channel("player-reviews-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "player_reviews" }, () => fetchRows())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRows = async () => {
    setLoading(true)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data } = await supabase
      .from("player_reviews")
      .select("*, casinos(name)")
      .order("created_at", { ascending: false })
      .range(from, to)
    setRows(data || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows
      .filter((r) => (status === "approved" ? r.is_approved : status === "pending" ? !r.is_approved : true))
      .filter((r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.reviewer_name || "").toLowerCase().includes(q) ||
        (r.casinos?.name || "").toLowerCase().includes(q),
      )
  }, [rows, search, status])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === "newest") arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === "oldest") arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortBy === "pending") arr.sort((a, b) => Number(a.is_approved) - Number(b.is_approved))
    return arr
  }, [filtered, sortBy])

  const batchApprove = async (onlyPending = true) => {
    const ids = rows.filter((r) => (onlyPending ? !r.is_approved : true)).map((r) => r.id)
    if (ids.length === 0) return
    const { error } = await supabase.from("player_reviews").update({ is_approved: true }).in("id", ids)
    if (!error) {
      await logAdminAction("batch_approve", "player_reviews", "*", { count: ids.length })
      toast({ title: "Approved pending reviews", description: `${ids.length} review(s) approved` })
      fetchRows()
    }
  }

  const toggleApproved = async (row: PlayerReviewRow) => {
    const { error } = await supabase.from("player_reviews").update({ is_approved: !row.is_approved }).eq("id", row.id)
    if (!error) {
      await logAdminAction("toggle_approved", "player_reviews", row.id, { is_approved: !row.is_approved })
      toast({ title: row.is_approved ? "Review hidden" : "Review approved", description: row.title })
      fetchRows()
    }
  }

  const deleteRow = async (row: PlayerReviewRow) => {
    if (!confirm("Delete this player review?")) return
    const { error } = await supabase.from("player_reviews").delete().eq("id", row.id)
    if (!error) {
      await logAdminAction("delete", "player_reviews", row.id, {})
      toast({ title: "Review deleted", description: row.title })
      fetchRows()
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage Player Reviews</h1>
          <p className="text-gray-400">Approve, hide, and moderate user-generated reviews</p>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by title, reviewer, or casino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="all" className="bg-black">All</option>
            <option value="pending" className="bg-black">Pending</option>
            <option value="approved" className="bg-black">Approved</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="newest" className="bg-black">Newest first</option>
            <option value="oldest" className="bg-black">Oldest first</option>
            <option value="pending" className="bg-black">Pending first</option>
          </select>
          <Button variant="outline" className="border-green-500 text-green-500 bg-transparent hover:bg-green-500/10" onClick={() => batchApprove(true)}>
            Approve All Pending
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading reviews...</div>
        ) : filtered.length > 0 ? (
          sorted.map((r) => (
            <GlassCard key={r.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/10 text-gray-300 px-2 py-1 rounded text-xs">{r.casinos?.name || "Unknown"}</span>
                    <span className={`px-2 py-1 rounded text-xs ${r.is_approved ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {r.is_approved ? "Approved" : "Hidden"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{r.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" />{r.reviewer_name || "Anonymous"}</span>
                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-[#00ff88] fill-current" />{r.rating}/5</span>
                  </div>
                  <p className="text-gray-400 line-clamp-2">{r.content}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${r.is_approved ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10" : "border-green-500 text-green-500 hover:bg-green-500/10"} bg-transparent`}
                    onClick={() => toggleApproved(r)}
                  >
                    {r.is_approved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500/10" asChild>
                    <Link href={`/reviews/${r.casino_id}`}>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 bg-transparent hover:bg-red-500/10"
                    onClick={() => deleteRow(r)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">No player reviews found.</div>
        )}
      </div>

      <PaginationControls page={page} setPage={setPage} disablePrev={page === 1} disableNext={filtered.length < pageSize} />
    </div>
  )
}


