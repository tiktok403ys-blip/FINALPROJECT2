"use client"

import { useEffect, useState } from "react"
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
    s === "scam" ? "bg-red-500 text-white" : "bg-yellow-500 text-black"

  const statusIcon = (s: StatusType) =>
    s === "scam" ? <ShieldAlert className="w-4 h-4 mr-1.5" /> : <Flag className="w-4 h-4 mr-1.5" />

  const fetchData = async () => {
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
  }

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
  }, [])

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
          <GlassCard key={rec.id} className="p-6 flex items-center justify-between">
            <div className="text-white font-medium">{rec.casino_name}</div>
            <div className="flex items-center gap-3">
              <Badge className={`${statusBadge(rec.status)} flex items-center`}>{statusIcon(rec.status)}{rec.status.charAt(0).toUpperCase()+rec.status.slice(1)}</Badge>
              <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(rec.id)}>Delete</Button>
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


