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
  casino_id: z.string().uuid({ message: "Select a casino" }),
  title: z.string().min(3, "Title too short"),
  bonus_amount: z.string().optional().default(""),
  bonus_type: z.string().optional().default(""),
  claim_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  promo_code: z.string().optional().or(z.literal("")),
  is_exclusive: z.boolean().optional().default(false),
  is_no_deposit: z.boolean().optional().default(false),
  wagering_x: z.coerce.number().int().positive().optional().or(z.literal(undefined)),
  free_spins: z.coerce.number().int().nonnegative().optional().or(z.literal(undefined)),
  free_spin_value: z.coerce.number().nonnegative().optional().or(z.literal(undefined)),
  max_bet: z.coerce.number().nonnegative().optional().or(z.literal(undefined)),
  expiry_days: z.coerce.number().int().nonnegative().optional().or(z.literal(undefined)),
  terms: z.string().optional().or(z.literal("")),
  how_to_get: z.string().optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export default function EditBonusPage() {
  const supabase = createClient()
  const params = useParams()
  const id = (params?.id as string) || ""
  const [casinos, setCasinos] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const load = async () => {
      const [casinosRes, bonusRes] = await Promise.all([
        supabase.from("casinos").select("id, name").order("name"),
        supabase.from("bonuses").select("*").eq("id", id).single(),
      ])
      setCasinos(casinosRes.data || [])
      if (bonusRes.error) setError("Failed to load bonus")
      else if (bonusRes.data) reset(bonusRes.data)
      setLoading(false)
    }
    if (id) load()
  }, [id, reset, supabase])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")
    const { error } = await supabase.from("bonuses").update(values).eq("id", id)
    if (error) setError(error.message)
    else window.location.href = "/admin/bonuses"
    setLoading(false)
  }

  const onDelete = async () => {
    if (!confirm("Delete this bonus?")) return
    setLoading(true)
    const { error } = await supabase.from("bonuses").delete().eq("id", id)
    if (error) setError(error.message)
    else window.location.href = "/admin/bonuses"
    setLoading(false)
  }

  return (
    <FormShell
      title="Edit Bonus"
      description="Update bonus info"
      headerExtra={
        <div className="flex gap-2">
          <Button variant="ghost" asChild className="text-white">
            <Link href="/admin/bonuses">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bonuses
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

          <div className="grid md:grid-cols-2 gap-4">
            <TextField label="Promo Code" {...register("promo_code")} placeholder="GURU2000" />
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Upload Image (optional)</label>
              <UploadInput folder="assets/bonuses/images" onUploaded={(url) => setValue("image_url" as any, url)} label="Upload Image" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <TextField label="Wagering (x)" type="number" inputMode="numeric" {...register("wagering_x")} placeholder="25" />
            <TextField label="Free Spins" type="number" inputMode="numeric" {...register("free_spins")} placeholder="200" />
            <TextField label="Value per Spin ($)" type="number" step="0.01" inputMode="decimal" {...register("free_spin_value")} placeholder="0.2" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <TextField label="Max Bet ($)" type="number" step="0.01" inputMode="decimal" {...register("max_bet")} placeholder="2" />
            <TextField label="Expiry (days)" type="number" inputMode="numeric" {...register("expiry_days")} placeholder="2" />
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-white text-sm">
                <input type="checkbox" {...register("is_exclusive")} /> Exclusive
              </label>
              <label className="inline-flex items-center gap-2 text-white text-sm">
                <input type="checkbox" {...register("is_no_deposit")} /> No deposit
              </label>
            </div>
          </div>

          <TextAreaField label="How to get" rows={3} {...register("how_to_get")} placeholder="Message live chat with promo code..." />
          <TextAreaField label="Terms and conditions" rows={5} {...register("terms")} placeholder={"• Bonus valid for new players only\n• One bonus per household/IP address\n• Wagering must be completed within 2 days\n• Maximum withdrawal from bonus winnings: $100\n• Full terms available on casino website"} />

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
              {loading ? "Saving..." : (<><Save className="w-4 h-4 mr-2" /> Save</>)}
            </Button>
            <Button type="button" variant="outline" className="border-white/10 text-white bg-transparent" asChild>
              <Link href="/admin/bonuses">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </FormShell>
  )
}


