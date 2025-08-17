"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  title: z.string().min(3, "Title too short"),
  content: z.string().min(10, "Content too short"),
  rating: z
    .string()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 5, { message: "Rating 0-5" }),
  game_variety_rating: z.string().optional(),
  customer_service_rating: z.string().optional(),
  payout_speed_rating: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function WriteReviewForm({ casinoId, onSubmitted }: { casinoId: string; onSubmitted?: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const checkAuthStatus = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    setIsLoggedIn(Boolean(data.user))
  }, [supabase])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Please login to write a review")
        setLoading(false)
        return
      }
      // App-side throttle: 1 review per 10 minutes per user per casino
      const throttleMinutes = 10
      const key = `pr:last:${casinoId}:${user.id}`
      const last = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      if (last) {
        const elapsed = Date.now() - Number(last)
        const remainMs = throttleMinutes * 60 * 1000 - elapsed
        if (remainMs > 0) {
          const remainMin = Math.ceil(remainMs / 60000)
          setError(`Please wait about ${remainMin} minute(s) before posting another review.`)
          setLoading(false)
          return
        }
      }
      const payload: any = {
        casino_id: casinoId,
        user_id: user.id,
        reviewer_name: user.email?.split("@")[0] || "Anonymous",
        title: values.title,
        content: values.content,
        rating: Number(values.rating),
        is_approved: false,
      }
      if (values.game_variety_rating) payload.game_variety_rating = Number(values.game_variety_rating)
      if (values.customer_service_rating) payload.customer_service_rating = Number(values.customer_service_rating)
      if (values.payout_speed_rating) payload.payout_speed_rating = Number(values.payout_speed_rating)

      const { error } = await supabase.from("player_reviews").insert(payload)
      if (error) setError(error.message)
      else {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, String(Date.now()))
        }
        reset()
        onSubmitted?.()
        router.refresh()
      }
    } catch (e) {
      setError("Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="p-4 border border-white/10 rounded-lg bg-white/5 text-gray-300 text-sm">
        Please login to write a review.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <Input placeholder="Review title" {...register("title")} />
      {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
      <div className="grid sm:grid-cols-4 gap-3">
        <Input placeholder="Rating 0-5" type="number" min="0" max="5" step="0.1" {...register("rating")} />
        <Input placeholder="Game Variety (0-5)" type="number" min="0" max="5" step="0.1" {...register("game_variety_rating")} />
        <Input placeholder="Customer Service (0-5)" type="number" min="0" max="5" step="0.1" {...register("customer_service_rating")} />
        <Input placeholder="Payout Speed (0-5)" type="number" min="0" max="5" step="0.1" {...register("payout_speed_rating")} />
      </div>
      <Textarea rows={5} placeholder="Share your experience..." {...register("content")} />
      {errors.content && <p className="text-xs text-red-400">{errors.content.message}</p>}
      <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}


