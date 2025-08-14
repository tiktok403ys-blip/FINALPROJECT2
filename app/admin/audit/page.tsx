"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/glass-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface AdminAction {
  id: string
  created_at: string
  user_id: string | null
  email: string | null
  action_type: string
  module_name: string
  item_id: string | null
  details: any
}

export default function AuditLogsPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<AdminAction[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)
      setLogs(data || [])
      setLoading(false)
    }
    fetchLogs()

    // Realtime subscription: refresh list on any change
    const channel = supabase
      .channel("admin-actions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_actions" },
        () => {
          fetchLogs()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    return (
      l.action_type.toLowerCase().includes(q) ||
      l.module_name.toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.item_id || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
        <p className="text-gray-400">Recent admin activities (read-only)</p>
      </div>

      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action/module/email/item id"
          className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <GlassCard key={log.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    {log.action_type} <span className="text-gray-400">on</span> {log.module_name}
                    {log.item_id && <span className="text-gray-400"> · id:</span>} {log.item_id}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {new Date(log.created_at).toLocaleString()} · {log.email || log.user_id || "unknown"}
                  </div>
                </div>
                {log.details && (
                  <pre className="text-xs text-gray-300 bg-white/5 p-2 rounded border border-white/10 max-w-[50%] overflow-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </GlassCard>
          ))}
          {filtered.length === 0 && <div className="text-gray-400">No logs found.</div>}
        </div>
      )}
    </div>
  )
}


