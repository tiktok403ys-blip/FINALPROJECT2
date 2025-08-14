"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FormShell } from "@/components/admin/forms/form-shell"
import { TextField, TextAreaField } from "@/components/admin/forms/fields"
import { UploadInput } from "@/components/admin/upload-input"
import { Button } from "@/components/ui/button"

interface SettingsRow {
  id?: string
  hero_image_url: string | null
  hero_title: string | null
  hero_subtitle: string | null
  hero_cta_primary_text: string | null
  hero_cta_primary_link: string | null
  hero_cta_secondary_text: string | null
  hero_cta_secondary_link: string | null
}

export default function SiteSettingsPage() {
  const supabase = createClient()
  const [row, setRow] = useState<SettingsRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle()
      if (error) setError(error.message)
      else setRow(
        data || {
          hero_image_url: null,
          hero_title: null,
          hero_subtitle: null,
          hero_cta_primary_text: null,
          hero_cta_primary_link: null,
          hero_cta_secondary_text: null,
          hero_cta_secondary_link: null,
        },
      )
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    if (!row) return
    setLoading(true)
    setError("")
    try {
      if (row.id) {
        const { data, error } = await supabase
          .from("site_settings")
          .upsert({ id: row.id, ...row }, { onConflict: "id" })
          .select()
          .maybeSingle()
        if (error) throw error
        if (data) setRow(data as SettingsRow)
      } else {
        const { data, error } = await supabase.from("site_settings").insert(row).select().maybeSingle()
        if (error) throw error
        if (data) setRow(data as SettingsRow)
      }
    } catch (e: any) {
      setError(e.message || "Failed to save settings")
    }
    setLoading(false)
  }

  return (
    <FormShell title="Site Settings" description="Manage homepage hero/banner">
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-400 text-sm mb-4">{error}</div>}
      {loading || !row ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-end gap-2">
            <TextField label="Hero Image URL" value={row.hero_image_url || ""} onChange={(e) => setRow({ ...row, hero_image_url: e.target.value })} placeholder="https://..." />
            <UploadInput folder="site/banners" onUploaded={(url) => setRow({ ...row, hero_image_url: url })} label="Upload Hero" />
          </div>
          <TextField label="Hero Title" value={row.hero_title || ""} onChange={(e) => setRow({ ...row, hero_title: e.target.value })} placeholder="Ultimate Casino Guide" />
          <TextAreaField label="Hero Subtitle" value={row.hero_subtitle || ""} onChange={(e) => setRow({ ...row, hero_subtitle: e.target.value })} className="min-h-[100px]" placeholder="Subtitle..." />
          <div className="grid md:grid-cols-2 gap-4">
            <TextField label="Primary CTA Text" value={row.hero_cta_primary_text || ""} onChange={(e) => setRow({ ...row, hero_cta_primary_text: e.target.value })} />
            <TextField label="Primary CTA Link" value={row.hero_cta_primary_link || ""} onChange={(e) => setRow({ ...row, hero_cta_primary_link: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <TextField label="Secondary CTA Text" value={row.hero_cta_secondary_text || ""} onChange={(e) => setRow({ ...row, hero_cta_secondary_text: e.target.value })} />
            <TextField label="Secondary CTA Link" value={row.hero_cta_secondary_link || ""} onChange={(e) => setRow({ ...row, hero_cta_secondary_link: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button onClick={save} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" disabled={loading}>Save</Button>
          </div>
        </div>
      )}
    </FormShell>
  )
}


