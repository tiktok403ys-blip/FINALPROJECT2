'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Plus, Save, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AlertRow {
  id: string
  text: string
  href: string | null
  is_active: boolean
  display_order: number
}

function AlertsPage() {
  const [rows, setRows] = useState<AlertRow[]>([])
  const [editing, setEditing] = useState<AlertRow | null>(null)

  const load = async () => {
    const client = supabase()
    const { data } = await client
      .from('home_alerts')
      .select('*')
      .order('display_order', { ascending: true })
    setRows((data as any[]) || [])
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing) return
    const client = supabase()
    if (editing.id) {
      await client.from('home_alerts').update({
        text: editing.text,
        href: editing.href,
        is_active: editing.is_active,
        display_order: editing.display_order,
      }).eq('id', editing.id)
    }
    setEditing(null)
    load()
  }

  const createNew = async () => {
    const client = supabase()
    const nextOrder = (rows[rows.length - 1]?.display_order || 0) + 1
    const { data } = await client.from('home_alerts').insert({ text: 'New alert', href: null, is_active: true, display_order: nextOrder }).select().single()
    setEditing(data as any)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this alert?')) return
    const client = supabase()
    await client.from('home_alerts').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <Link href="/admin/home" className="text-white/70 hover:text-white flex items-center"><ArrowLeft className="w-4 h-4 mr-2"/>Back</Link>
          <h1 className="text-2xl font-bold">Home Alerts</h1>
        </div>
        <Button onClick={createNew} className="bg-white/10 border-white/20 text-white hover:bg-white/20"><Plus className="w-4 h-4 mr-2"/>Add</Button>
      </div>

      {editing && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Edit Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-white/80 text-sm">Text</label>
              <Input className="bg-white/5 border-white/20 text-white" value={editing.text} onChange={e => setEditing({ ...editing, text: e.target.value })}/>
            </div>
            <div>
              <label className="text-white/80 text-sm">Link (optional)</label>
              <Input className="bg-white/5 border-white/20 text-white" value={editing.href || ''} onChange={e => setEditing({ ...editing, href: e.target.value || null })}/>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-white/80">
                <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })}/>
                Active
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm">Order</span>
                <Input type="number" className="w-20 bg-white/5 border-white/20 text-white" value={editing.display_order} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value || '0') })}/>
              </div>
              <Button onClick={save} className="ml-auto bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-2"/>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {rows.map(r => (
          <Card key={r.id} className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-white">
                <div className="font-medium">{r.text}</div>
                <div className="text-xs text-white/60">{r.href || '—'} • Order {r.display_order}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={r.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button variant="outline" className="border-white/20 text-white" onClick={() => setEditing(r)}>Edit</Button>
                <Button variant="outline" className="border-red-400/30 text-red-400" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AlertsPageWrapper() {
  return (
    <ProtectedRoute>
      <AlertsPage />
    </ProtectedRoute>
  )
}


