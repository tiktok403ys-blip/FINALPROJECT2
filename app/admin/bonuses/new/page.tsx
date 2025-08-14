"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { FormShell } from "@/components/admin/forms/form-shell"
import { TextField } from "@/components/admin/forms/fields"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

const schema = z.object({
  casino_id: z.string().uuid({ message: "Select a casino" }),
  title: z.string().min(3, "Title too short"),
  bonus_amount: z.string().optional().default(""),
  bonus_type: z.string().optional().default(""),
  claim_url: z.string().url("Invalid URL").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export default function NewBonusPage() {
  const supabase = createClient()
  const [casinos, setCasinos] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const loadCasinos = async () => {
      const { data } = await supabase.from("casinos").select("id, name").order("name")
      setCasinos(data || [])
    }
    loadCasinos()
  }, [])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")
    const { error } = await supabase.from("bonuses").insert(values)
    if (error) setError(error.message)
    else window.location.href = "/admin/bonuses"
    setLoading(false)
  }

  return (
    <FormShell
      title="Create Bonus"
      description="Add a new casino bonus"
      headerExtra={
        <Button variant="ghost" asChild className="text-white">
          <Link href="/admin/bonuses">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bonuses
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
              <option value="" className="bg-black">Select casino</option>
              {casinos.map((c) => (
                <option key={c.id} value={c.id} className="bg-black">{c.name}</option>
              ))}
            </select>
            {errors.casino_id && <p className="text-xs text-red-400">{errors.casino_id.message}</p>}
          </div>
          <TextField label="Title *" {...register("title")} error={errors.title?.message} placeholder="Enter bonus title" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <TextField label="Bonus Amount" {...register("bonus_amount")} placeholder="$100 + 100 FS" />
          <TextField label="Bonus Type" {...register("bonus_type")} placeholder="WELCOME / CASHBACK / etc" />
        </div>

        <TextField label="Claim URL" {...register("claim_url")} placeholder="https://..." error={errors.claim_url?.message} />

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
            {loading ? "Creating..." : (<><Save className="w-4 h-4 mr-2" /> Create Bonus</>)}
          </Button>
          <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
            <Link href="/admin/bonuses">Cancel</Link>
          </Button>
        </div>
      </form>
    </FormShell>
  )
}


