'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Upload, Trash2, Check, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useCallback } from 'react'

interface FaviconRow {
  id: string
  name: string
  url: string
  is_active: boolean
  created_at: string
}

function FaviconPageInner() {
  const supabase = createClient()
  const [items, setItems] = useState<FaviconRow[]>([])
  const [uploading, setUploading] = useState(false)
  const { success, error: showError } = useToast()

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('favicons')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      showError('Failed', 'Load favicons failed')
      return
    }
    setItems(data || [])
  }, [supabase, showError])

  useEffect(() => { load() }, [load])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `admin/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('favicons').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('favicons').getPublicUrl(path)
      const { error: insErr } = await supabase.from('favicons').insert({ name: file.name, url: urlData.publicUrl, is_active: false })
      if (insErr) throw insErr
      success('Uploaded', 'Favicon uploaded successfully')
      await load()
    } catch (err) {
      console.error(err)
      showError('Upload Failed', 'Please try again')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function setActive(id: string) {
    try {
      const { error } = await supabase.rpc('set_active_favicon', { p_id: id })
      if (error) throw error
      success('Updated', 'Active favicon updated')
      await load()
    } catch (err) {
      console.error(err)
      showError('Update Failed', 'Please try again')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this favicon?')) return
    try {
      const { error } = await supabase.from('favicons').delete().eq('id', id)
      if (error) throw error
      success('Deleted', 'Favicon removed')
      await load()
    } catch (err) {
      console.error(err)
      showError('Delete Failed', 'Please try again')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Favicon Manager</h1>
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-white/20 rounded cursor-pointer text-white/80 hover:bg-white/10">
          <Upload className="w-4 h-4" /> Upload
          <Input type="file" accept="image/x-icon,image/png" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-base">Uploaded Favicons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((row) => (
              <div key={row.id} className="p-4 border border-white/10 rounded-lg flex items-center gap-3 bg-black/40">
                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center overflow-hidden">
                  <Image src={row.url} alt={row.name} width={32} height={32} className="w-8 h-8 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{row.name}</div>
                  <div className="text-white/50 text-xs truncate">{row.url}</div>
                </div>
                {row.is_active ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                ) : (
                  <Button size="sm" onClick={() => setActive(row.id)} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                    <Check className="w-4 h-4 mr-1" /> Set Active
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => remove(row.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-white/60 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> No favicons uploaded
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FaviconPage() {
  return (
    <ProtectedRoute>
      <FaviconPageInner />
    </ProtectedRoute>
  )
}


