"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FormShell } from "@/components/admin/forms/form-shell"
import { TextField, TextAreaField } from "@/components/admin/forms/fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UploadInput } from "@/components/admin/upload-input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

const schema = z.object({
  title: z.string().min(3, "Title is too short"),
  content: z.string().min(10, "Content is too short"),
  excerpt: z.string().optional().default(""),
  category: z.string().optional().default(""),
  published: z.boolean().optional().default(false),
  image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export default function EditNewsPage() {
  const router = useRouter()
  const params = useParams()
  const id = (params?.id as string) || ""
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { published: false } })

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      const { data, error } = await supabase.from("news").select("*").eq("id", id).single()
      if (error) {
        setError("Failed to load article")
      } else if (data) {
        reset({
          title: data.title ?? "",
          content: data.content ?? "",
          excerpt: data.excerpt ?? "",
          category: data.category ?? "",
          published: Boolean(data.published),
          image_url: data.image_url ?? "",
        })
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const parseAssetsPath = (url?: string | null): string | null => {
    if (!url) return null
    const marker = "/storage/v1/object/public/assets/"
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.substring(idx + marker.length)
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")
    // Find previous to handle housekeeping when image replaced
    const { data: prev } = await supabase.from("news").select("image_url").eq("id", id).single()
    const { error } = await supabase.from("news").update(values).eq("id", id)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Housekeeping: delete old image if replaced
    const oldPath = parseAssetsPath(prev?.image_url)
    const newPath = parseAssetsPath(values.image_url)
    if (oldPath && newPath && oldPath !== newPath) {
      await supabase.storage.from("assets").remove([oldPath])
    }
    router.push("/admin/news")
  }

  const onDelete = async () => {
    if (!confirm("Delete this article? This action cannot be undone.")) return
    setLoading(true)
    // remove associated image if exists
    const { data: prev } = await supabase.from("news").select("image_url").eq("id", id).single()
    const { error } = await supabase.from("news").delete().eq("id", id)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const oldPath = parseAssetsPath(prev?.image_url)
    if (oldPath) {
      await supabase.storage.from("assets").remove([oldPath])
    }
    router.push("/admin/news")
  }

  const categories = ["Regulation", "Games", "Security", "Industry", "Reviews", "Bonuses"]

  return (
    <FormShell
      title="Edit News Article"
      description="Update and publish your news article"
      headerExtra={
        <div className="flex gap-2">
          <Button variant="ghost" asChild className="text-white">
            <Link href="/admin/news">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to News
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
          <div className="grid md:grid-cols-2 gap-4">
            <TextField label="Title *" {...register("title")} error={errors.title?.message} placeholder="Enter title" />
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Category</label>
              <select {...register("category")} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
                <option value="" className="bg-black">
                  Select category
                </option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-black">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TextAreaField label="Excerpt" {...register("excerpt")} className="min-h-[80px]" placeholder="Short summary" />

          {/* Thumbnail/hero image */}
          <div className="grid md:grid-cols-2 gap-4 items-end">
            <TextField label="Image URL" {...register("image_url")} placeholder="https://..." />
            <UploadInput folder="news/images" onUploaded={(url) => {
              const input = document.querySelector<HTMLInputElement>('input[name="image_url"]')
              if (input) input.value = url
            }} label="Upload Image" />
          </div>
          <TextAreaField label="Content *" {...register("content")} className="min-h-[300px]" placeholder="Write content..." error={errors.content?.message} />

          <div className="flex items-center gap-2">
            <input type="checkbox" id="published" {...register("published")} className="w-4 h-4 text-[#00ff88] bg-white/5 border-white/10 rounded" />
            <label htmlFor="published" className="text-white text-sm font-medium">
              Published
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> {watch("published") ? "Save & Publish" : "Save Draft"}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
              <Link href="/admin/news">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </FormShell>
  )
}


