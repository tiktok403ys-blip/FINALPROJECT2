"use client"

import { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/admin/image-upload"
import { toast } from "sonner"

interface HeroSection {
  id: string
  page_name: string
  section_name: string
  title: string | null
  content: string | null
  image_url: string | null
  display_order: number | null
  is_active: boolean | null
}

export default function HeroBannerAdmin() {
  const supabase = createClient()
  const [row, setRow] = useState<HeroSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("page_sections")
      .select("*")
      .eq("page_name", "home")
      .eq("section_name", "hero")
      .limit(1)
      .maybeSingle()
    setRow((data as any) || null)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!row) return
    if (!row.title || !row.title.trim()) { toast.error("Title is required"); return }
    setSaving(true)
    try {
      let payload: any = {
        title: row.title || null,
        content: row.content || null,
        image_url: row.image_url || null,
        is_active: true,
      }
      const query = supabase.from("page_sections")
      let res
      if (row.id) {
        res = await query.update(payload).eq("id", row.id).select().maybeSingle()
      } else {
        res = await query.insert([{ ...payload, page_name: "home", section_name: "hero", display_order: 1 }]).select().maybeSingle()
      }
      if ((res as any).error) throw (res as any).error
      setRow((res as any).data as any)
      toast.success("Hero saved")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to save hero")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Hero Banner (Home)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Title</label>
                <Input value={row?.title || ""} onChange={(e) => setRow(r => r ? { ...r, title: e.target.value } : r)} className="bg-white/5 border-white/20 text-white placeholder:text-white/50" />
              </div>
              <div>
                <label className="text-white/90 text-sm font-medium mb-2 block">Subtitle</label>
                <Input value={row?.content || ""} onChange={(e) => setRow(r => r ? { ...r, content: e.target.value } : r)} className="bg-white/5 border-white/20 text-white placeholder:text-white/50" />
              </div>
              <div>
                <ImageUpload
                  value={row?.image_url || ""}
                  onChange={(url) => setRow(r => r ? { ...r, image_url: url } : r)}
                  bucket="casino-images"
                  label="Hero Image"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={save} disabled={saving} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                  {saving ? "Saving..." : "Save Hero"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


