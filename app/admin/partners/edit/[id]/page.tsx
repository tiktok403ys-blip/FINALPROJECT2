"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { FormShell } from "@/components/admin/forms/form-shell"
import { TextField, TextAreaField } from "@/components/admin/forms/fields"
import { UploadInput } from "@/components/admin/upload-input"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  // Accept either full URL or bucket/path or empty
  logo_url: z.string().optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  description: z.string().optional().default(""),
  partner_type: z.string().default("partner"),
  display_order: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Must be a number" }),
  is_active: z.boolean().optional().default(true),
})

type FormValues = z.infer<typeof schema>

export default function EditPartnerPage() {
  const params = useParams()
  const id = (params?.id as string) || ""
  const supabase = createClient()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { partner_type: "partner", is_active: true },
  })
  const [prevLogoPath, setPrevLogoPath] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("partners").select("*").eq("id", id).single()
      if (error) setError("Failed to load partner")
      else if (data)
        reset({
          name: data.name ?? "",
          logo_url: data.logo_url ?? "",
          website_url: data.website_url ?? "",
          description: data.description ?? "",
          partner_type: data.partner_type ?? "partner",
          display_order: String(data.display_order ?? ""),
          is_active: Boolean(data.is_active),
        })
      setPrevLogoPath(parseAssetsPath(data?.logo_url || ""))
      setLoading(false)
    }
    if (id) load()
  }, [id, reset, supabase])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")
    const payload: any = { ...values }
    if (typeof payload.display_order === "string" && payload.display_order !== "") payload.display_order = Number(payload.display_order)
    const { error } = await supabase.from("partners").update(payload).eq("id", id)
    if (error) setError(error.message)
    else {
      const newPath = parseAssetsPath(payload.logo_url || "")
      if (prevLogoPath && newPath !== prevLogoPath) {
        const [prevBucket, ...restPrev] = prevLogoPath.split("/")
        const prevKey = restPrev.join("/")
        if (prevBucket && prevKey) {
          await supabase.storage.from(prevBucket).remove([prevKey])
        }
      }
      window.location.href = "/admin/partners"
    }
    setLoading(false)
  }

  const onDelete = async () => {
    if (!confirm("Delete this partner?")) return
    setLoading(true)
    const { error } = await supabase.from("partners").delete().eq("id", id)
    if (error) setError(error.message)
    else window.location.href = "/admin/partners"
    setLoading(false)
  }

  return (
    <FormShell
      title="Edit Partner"
      description="Update partner information"
      headerExtra={
        <div className="flex gap-2">
          <Button variant="ghost" asChild className="text-white">
            <Link href="/admin/partners">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Partners
            </Link>
          </Button>
          <Button onClick={onDelete} variant="outline" className="border-red-500/40 text-red-400 bg-transparent hover:bg-red-500/10" disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      }
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TextField label="Partner Name *" {...register("name")} error={errors.name?.message} placeholder="Evolution Gaming" />
          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div className="flex items-center gap-2">
              <TextField label="Logo bucket/path" {...register("logo_url")} placeholder="assets/partners/logos/xyz.png" error={errors.logo_url?.message} />
              <UploadInput folder="partners/logos" onUploaded={(bucketPath) => setValue("logo_url", bucketPath)} />
            </div>
            <TextField label="Website URL" {...register("website_url")} placeholder="https://example.com" error={errors.website_url?.message} />
          </div>
          <TextAreaField label="Description" {...register("description")} className="min-h-[80px]" placeholder="Brief description of the partner..." />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Partner Type</label>
              <select {...register("partner_type")} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
                {['partner','sponsor','affiliate'].map((t) => (
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <TextField label="Display Order" {...register("display_order")} type="number" placeholder="0" error={errors.display_order?.message} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register("is_active")} className="w-4 h-4 text-[#00ff88] bg-white/5 border-white/10 rounded" />
            <label htmlFor="is_active" className="text-white text-sm font-medium">Active</label>
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
              {loading ? "Saving..." : (<><Save className="w-4 h-4 mr-2" /> Save</>)}
            </Button>
            <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
              <Link href="/admin/partners">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </FormShell>
  )
}

function parseAssetsPath(input: string): string | null {
  if (!input) return null
  // If already in bucket/path form
  if (!input.startsWith("http")) return input
  const base = "/storage/v1/object/public/"
  const idx = input.indexOf(base)
  if (idx === -1) return null
  return input.substring(idx + base.length)
}


