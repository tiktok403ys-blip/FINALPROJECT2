"use client"

import type React from "react"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { FormShell } from "@/components/admin/forms/form-shell"
import { TextField, TextAreaField } from "@/components/admin/forms/fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UploadInput } from "@/components/admin/upload-input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

const schema = z.object({
  title: z.string().min(3, "Title is too short"),
  content: z.string().min(10, "Content is too short"),
  excerpt: z.string().optional().default(""),
  category: z.string().optional().default(""),
  published: z.boolean().optional().default(false),
  image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export default function NewNewsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { published: false } })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("news").insert({ ...data, author_id: user?.id })

      if (error) {
        setError(error.message)
      } else {
        router.push("/admin/news")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const categories = ["Regulation", "Games", "Security", "Industry", "Reviews", "Bonuses"]

  return (
    <FormShell
      title="Create News Article"
      description="Write and publish a new news article"
      headerExtra={
        <Button variant="ghost" asChild className="text-white">
          <Link href="/admin/news">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to News
          </Link>
        </Button>
      }
    >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <TextField label="Title *" {...register("title")} error={errors.title?.message} placeholder="Enter article title" />
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Category</label>
                <select {...register("category")} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
                  <option value="" className="bg-black">
                    Select category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-black">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <TextAreaField label="Excerpt" {...register("excerpt")} placeholder="Brief summary of the article..." />

            {/* Thumbnail/hero image */}
            <div className="grid md:grid-cols-2 gap-4 items-end">
              <TextField label="Image URL" {...register("image_url")} placeholder="https://..." />
              <UploadInput folder="news/images" onUploaded={(url) => setValue("image_url", url)} label="Upload Image" />
            </div>

            <TextAreaField label="Content *" {...register("content")} placeholder="Write your article content here..." className="min-h-[300px]" error={errors.content?.message} />

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="published" {...register("published")} className="w-4 h-4 text-[#00ff88] bg-white/5 border-white/10 rounded focus:ring-[#00ff88]" />
              <label htmlFor="published" className="text-white text-sm font-medium">
                Publish immediately
              </label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {watch("published") ? "Publish Article" : "Save Draft"}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
                <Link href="/admin/news">Cancel</Link>
              </Button>
            </div>
          </form>
    </FormShell>
  )
}
