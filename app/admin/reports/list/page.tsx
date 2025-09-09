"use client"

import { useEffect, useState, useCallback } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, RefreshCw, ShieldAlert, Flag } from "lucide-react"

type StatusType = "scam" | "suspicious"

interface ListRecord {
  id: string
  casino_name: string
  status: StatusType
  created_at?: string
  updated_at?: string
}

export default function AdminReportsListPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<ListRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<{ casino_name: string; status: StatusType }>(
    { casino_name: "", status: "suspicious" }
  )

  const statusBadge = (s: StatusType) =>
    s === "scam" ? "bg-red-500 text-white" : "bg-yellow-500 text-white"

  const accentBorder = (s: StatusType) =>
    s === "scam" ? "border-l-red-500" : "border-l-yellow-400"

  const gradientBg = (s: StatusType) =>
    s === "scam" ? "from-red-500/10 via-transparent to-transparent" : "from-yellow-400/10 via-transparent to-transparent"

  const ringStyle = (s: StatusType) =>
    s === "scam" ? "ring-red-500/30 text-red-400" : "ring-yellow-400/30 text-yellow-300"

  const statusIcon = (s: StatusType) =>
    s === "scam" ? <ShieldAlert className="w-4 h-4 mr-1.5" /> : <Flag className="w-4 h-4 mr-1.5" />

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/reports-list", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to fetch")
      setItems(json.data || [])
    } catch (e) {
      toast({ title: "Error", description: "Failed to load data", variant: "error" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleCreate = async () => {
    try {
      if (!form.casino_name.trim()) {
        toast({ title: "Validation", description: "Casino name is required", variant: "error" })
        return
      }
      const res = await fetch("/api/admin/reports-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to create")
      setForm({ casino_name: "", status: "suspicious" })
      setCreateOpen(false)
      toast({ title: "Created", description: "Record added" })
      fetchData()
    } catch (e) {
      toast({ title: "Error", description: "Failed to create record", variant: "error" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reports-list/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error || "Failed to delete")
      toast({ title: "Deleted", description: "Record removed" })
      fetchData()
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete record", variant: "error" })
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports List</h1>
          <p className="text-sm text-white/60">Manage public status cards for /reports/list</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80"
          >
            <Plus className="w-4 h-4 mr-2" /> New
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Create */}
      {createOpen && (
        <GlassCard className="p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-white">Casino Name *</label>
              <Input
                value={form.casino_name}
                onChange={(e) => setForm((f) => ({ ...f, casino_name: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Example Casino"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusType }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                  <SelectItem value="scam">Scam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleCreate} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 w-full">Create</Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setCreateOpen(false)}>Cancel</Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading && (
          <GlassCard className="p-6 text-white/70">Loading...</GlassCard>
        )}
        {!loading && items.map((rec) => (
          <GlassCard
            key={rec.id}
            className={`relative overflow-hidden group p-5 md:p-6 border-l-4 ${accentBorder(rec.status)} transition-transform hover:-translate-y-0.5`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${gradientBg(rec.status)}`} />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center ring-1 ${ringStyle(rec.status)} bg-white/5`}>
                  {statusIcon(rec.status)}
                </span>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-base md:text-lg truncate">{rec.casino_name}</div>
                  <div className="text-xs text-white/50 mt-0.5">Public Status</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`${statusBadge(rec.status)} flex items-center px-3 py-1.5`}>{statusIcon(rec.status)}{rec.status.charAt(0).toUpperCase()+rec.status.slice(1)}</Badge>
                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(rec.id)}>Delete</Button>
              </div>
            </div>
          </GlassCard>
        ))}
        {!loading && items.length === 0 && (
          <GlassCard className="p-8 text-center text-white/60">No data yet.</GlassCard>
        )}
      </div>
    </div>
  )
}


