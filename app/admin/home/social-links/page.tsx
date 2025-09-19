"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface SocialLink {
  id?: string
  name: string
  icon: string
  url: string
  sort_order: number
  is_active: boolean
}

const ICON_TIPS = "Supported examples: facebook, telegram, whatsapp (match footer mapping)."

export default function SocialLinksAdminPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) {
      toast.error(error.message)
    } else {
      const incoming = ((data as any) || []) as SocialLink[]
      const presetKeys = ['whatsapp','telegram','facebook']
      const byIcon = new Map(incoming.map(r => [r.icon, r]))
      presetKeys.forEach((key, idx) => {
        if (!byIcon.has(key)) {
          const label = key.charAt(0).toUpperCase() + key.slice(1)
          incoming.push({ name: label, icon: key, url: '', sort_order: (incoming.length + idx + 1), is_active: true })
        }
      })
      setRows(incoming)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const addRow = () => {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0)
    setRows(prev => [...prev, { name: '', icon: '', url: '', sort_order: maxSort + 1, is_active: true }])
  }

  const updateRow = (index: number, patch: Partial<SocialLink>) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r))
  }

  const removeRow = (index: number) => {
    const row = rows[index]
    if (row?.id) {
      // mark for deletion in save
      setRows(prev => prev.map((r, i) => i === index ? { ...r, _delete: true } as any : r))
    } else {
      setRows(prev => prev.filter((_, i) => i !== index))
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const toDelete = rows.filter((r: any) => r._delete && r.id)
      for (const r of toDelete) {
        const { error } = await supabase.from('social_links').delete().eq('id', r.id)
        if (error) throw error
      }
      const clean = rows.filter((r: any) => !r._delete)
      // upsert by unique icon
      const payload = clean
        .filter(r => r.name?.trim() && r.icon?.trim() && r.url?.trim())
        .map(r => ({ name: r.name, icon: r.icon, url: r.url, sort_order: r.sort_order, is_active: r.is_active, id: r.id }))
      if (payload.length) {
        const { error } = await supabase.from('social_links').upsert(payload, { onConflict: 'icon' })
        if (error) throw error
      }
      toast.success('Social links saved')
      await load()
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Failed to save social links')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Social Links (Home)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <>
              {/* Preset 3 fixed forms for WhatsApp, Telegram, Facebook */}
              <div className="grid grid-cols-1 gap-3">
                {[ 
                  { key: 'whatsapp', label: 'WhatsApp' },
                  { key: 'telegram', label: 'Telegram' },
                  { key: 'facebook', label: 'Facebook' }
                ].map((preset) => {
                  const i = rows.findIndex(r => r.icon === preset.key)
                  return (
                    <div key={preset.key} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-white/5 p-3 rounded-lg">
                      <Input
                        value={rows[i].name}
                        onChange={(e) => updateRow(i, { name: e.target.value })}
                        placeholder={`${preset.label} Name`}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50 md:col-span-2"
                      />
                      <Input
                        value={rows[i].icon}
                        disabled
                        className="bg-white/5 border-white/20 text-white md:col-span-1"
                      />
                      <Input
                        value={rows[i].url}
                        onChange={(e) => updateRow(i, { url: e.target.value })}
                        placeholder={`https://... (${preset.label})`}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50 md:col-span-2"
                      />
                      <div className="flex items-center gap-2">
                        <Switch checked={rows[i].is_active} onCheckedChange={(v) => updateRow(i, { is_active: !!v })} />
                        <span className="text-xs text-gray-300">Active</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <hr className="border-white/10" />
              <div className="text-xs text-gray-400">{ICON_TIPS}</div>
              <div className="space-y-3">
                {rows
                  .filter((row) => !['whatsapp','telegram','facebook'].includes(row.icon))
                  .map((row, i) => (
                  <div key={row.id || `tmp-${i}`} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-white/5 p-3 rounded-lg">
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(rows.findIndex(r => r.icon === row.icon), { name: e.target.value })}
                      placeholder="Name (e.g., Facebook)"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50 md:col-span-2"
                    />
                    <Input
                      value={row.icon}
                      onChange={(e) => updateRow(rows.findIndex(r => r.icon === row.icon), { icon: e.target.value })}
                      placeholder="Icon key (facebook/telegram/whatsapp)"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Input
                      value={row.url}
                      onChange={(e) => updateRow(rows.findIndex(r => r.icon === row.icon), { url: e.target.value })}
                      placeholder="https://..."
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50 md:col-span-2"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={row.sort_order}
                        onChange={(e) => updateRow(rows.findIndex(r => r.icon === row.icon), { sort_order: Number(e.target.value) })}
                        className="bg-white/5 border-white/20 text-white w-20"
                      />
                      <label className="text-xs text-gray-400">Order</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={row.is_active} onCheckedChange={(v) => updateRow(rows.findIndex(r => r.icon === row.icon), { is_active: !!v })} />
                      <span className="text-xs text-gray-300">Active</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 md:col-span-6">
                      <Button variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => removeRow(rows.findIndex(r => r.icon === row.icon))}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" className="border-white/20 text-white" onClick={addRow}>Add Link</Button>
                <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


