"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { FormShell } from "@/components/admin/forms/form-shell"
import { TextField, TextAreaField } from "@/components/admin/forms/fields"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

const schema = z.object({
  casino_id: z.string().uuid({ message: "Select a casino" }),
  title: z.string().min(3, "Title too short"),
  content: z.string().min(10, "Content too short"),
  rating: z
    .string()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 5, { message: "Rating 0-5" }),
  author_name: z.string().min(2, "Author required"),
  is_published: z.boolean().optional().default(false),
})

type FormValues = z.infer<typeof schema>

export default function NewReviewPage() {
  const supabase = createClient()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [casinos, setCasinos] = useState<{ id: string; name: string }[]>([])
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { is_published: false } })

  useEffect(() => {
    const loadCasinos = async () => {
      const { data } = await supabase.from("casinos").select("id, name").order("name", { ascending: true })
      setCasinos(data || [])
    }
    loadCasinos()
  }, [])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")
    const { error } = await supabase
      .from("casino_reviews")
      .insert({ ...values, rating: Number(values.rating) })
    if (error) setError(error.message)
    else window.location.href = "/admin/reviews"
    setLoading(false)
  }

  return (
    <FormShell
      title="Create Review"
      description="Write and publish a casino review"
      headerExtra={
        <Button variant="ghost" asChild className="text-white">
          <Link href="/admin/reviews">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reviews
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
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Casino *</label>
            <select {...register("casino_id")} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white">
              <option value="" className="bg-black">
                Select casino
              </option>
              {casinos.map((c) => (
                <option key={c.id} value={c.id} className="bg-black">
                  {c.name}
                </option>
              ))}
            </select>
            {errors.casino_id && <p className="text-xs text-red-400">{errors.casino_id.message}</p>}
          </div>
          <TextField label="Title *" {...register("title")} error={errors.title?.message} placeholder="Enter review title" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <TextField label="Rating (0-5) *" {...register("rating")} type="number" min="0" max="5" step="0.1" error={errors.rating?.message} />
          <TextField label="Author Name *" {...register("author_name")} error={errors.author_name?.message} placeholder="Your name" />
        </div>

        <TextAreaField label="Content *" {...register("content")} className="min-h-[200px]" placeholder="Write your review..." error={errors.content?.message} />

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_published" {...register("is_published")} className="w-4 h-4 text-[#00ff88] bg-white/5 border-white/10 rounded" />
          <label htmlFor="is_published" className="text-white text-sm font-medium">
            Publish immediately
          </label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> {watch("is_published") ? "Publish Review" : "Save Draft"}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
            <Link href="/admin/reviews">Cancel</Link>
          </Button>
        </div>
      </form>
    </FormShell>
  )
}


