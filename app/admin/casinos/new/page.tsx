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
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  description: z.string().optional().default(""),
  rating: z
    .string()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 5), {
      message: "Rating must be between 0 and 5",
    }),
  location: z.string().optional().default(""),
  bonus_info: z.string().optional().default(""),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export default function NewCasinoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.from("casinos").insert({ ...values, rating: values.rating ? Number(values.rating) : null })

      if (error) {
        setError(error.message)
      } else {
        router.push("/admin/casinos")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormShell
      title="Add New Casino"
      description="Create a new casino listing"
      headerExtra={
        <Button variant="ghost" asChild className="text-white">
          <Link href="/admin/casinos">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Casinos
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
              <TextField label="Casino Name *" {...register("name")} error={errors.name?.message} placeholder="Enter casino name" />
              <TextField
                label="Rating (0-5)"
                {...register("rating")}
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="4.5"
                error={errors.rating?.message}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <TextField label="Location" {...register("location")} placeholder="Malta, Curacao, etc." />
              <TextField label="Website URL" {...register("website_url")} type="url" placeholder="https://casino.com" error={errors.website_url?.message} />
            </div>

            <TextAreaField label="Description" {...register("description")} className="min-h-[100px]" placeholder="Describe the casino..." />

            <TextAreaField label="Bonus Information" {...register("bonus_info")} className="min-h-[80px]" placeholder="Welcome bonus details..." />

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Casino
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
                <Link href="/admin/casinos">Cancel</Link>
              </Button>
            </div>
          </form>
    </FormShell>
  )
}
