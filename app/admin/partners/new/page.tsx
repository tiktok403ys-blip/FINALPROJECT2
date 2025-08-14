"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FormShell } from "@/components/admin/forms/form-shell"
import { TextField, TextAreaField } from "@/components/admin/forms/fields"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
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

export default function NewPartnerPage() {
  const supabase = createClient()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { partner_type: "partner", is_active: true } })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")
    const payload: any = { ...values }
    if (typeof payload.display_order === "string" && payload.display_order !== "") payload.display_order = Number(payload.display_order)
    const { error } = await supabase.from("partners").insert(payload)
    if (error) setError(error.message)
    else window.location.href = "/admin/partners"
    setLoading(false)
  }

  return (
    <FormShell
      title="Add New Partner"
      description="Create a new partner entry"
      headerExtra={
        <Button variant="ghost" asChild className="text-white">
          <Link href="/admin/partners">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Partners
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
        <TextField label="Partner Name *" {...register("name")} error={errors.name?.message} placeholder="Evolution Gaming" />
        <div className="grid md:grid-cols-2 gap-4">
          <TextField label="Logo URL" {...register("logo_url")} placeholder="/placeholder.svg?height=60&width=120&text=Logo" error={errors.logo_url?.message} />
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
            {loading ? "Creating..." : (<><Save className="w-4 h-4 mr-2" /> Create Partner</>)}
          </Button>
          <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
            <Link href="/admin/partners">Cancel</Link>
          </Button>
        </div>
      </form>
    </FormShell>
  )
}


