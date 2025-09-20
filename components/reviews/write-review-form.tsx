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
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

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
  const { success, error: toastError } = useToast()
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

      // Throttling: logged-in 10 menit; guest 1 per hari
      const now = Date.now()
      if (user) {
        const throttleMinutes = 10
        const key = `pr:last:${casinoId}:${user.id}`
        const last = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
        if (last) {
          const elapsed = now - Number(last)
          const remainMs = throttleMinutes * 60 * 1000 - elapsed
          if (remainMs > 0) {
            const remainMin = Math.ceil(remainMs / 60000)
            setError(`Please wait about ${remainMin} minute(s) before posting another review.`)
            setLoading(false)
            return
          }
        }
      } else {
        const dayKey = `pr:guest:${casinoId}:${new Date().toISOString().slice(0,10)}`
        const done = typeof window !== 'undefined' ? window.localStorage.getItem(dayKey) : null
        if (done) {
          setError("Guest reviews are limited to 1 per day. Please try again tomorrow.")
          setLoading(false)
          return
        }
      }

      const payload: any = {
        casino_id: casinoId,
        user_id: user ? user.id : null,
        reviewer_name: user ? (user.email?.split("@")[0] || "Anonymous") : `Guest-${Math.random().toString(36).slice(2,6)}`,
        title: values.title,
        content: values.content,
        rating: Number(values.rating),
        is_approved: !!user, // logged-in auto-approve; guest pending
      }
      if (values.game_variety_rating) payload.game_variety_rating = Number(values.game_variety_rating)
      if (values.customer_service_rating) payload.customer_service_rating = Number(values.customer_service_rating)
      if (values.payout_speed_rating) payload.payout_speed_rating = Number(values.payout_speed_rating)

      const { error } = await supabase.from("player_reviews").insert(payload)
      if (error) {
        setError(error.message)
        toastError("Failed to submit review", error.message)
      } else {
        if (typeof window !== 'undefined') {
          if (user) {
            const key = `pr:last:${casinoId}:${user.id}`
            window.localStorage.setItem(key, String(now))
          } else {
            const dayKey = `pr:guest:${casinoId}:${new Date().toISOString().slice(0,10)}`
            window.localStorage.setItem(dayKey, "1")
          }
        }
        reset()
        onSubmitted?.()
        success("Thank you!", user ? "Your review is published." : "Your review is submitted and awaiting approval.")
        router.refresh()
      }
    } catch (e) {
      setError("Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {!isLoggedIn && (
        <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-white/5">
          <p className="text-gray-300 text-sm sm:text-base">
            You are submitting as <span className="text-white font-semibold">Guest</span>.
            Guest reviews are limited to 1 per day and will appear after approval. Login to publish instantly.
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <Button asChild className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent">
              <Link href="/auth/register">Create Account</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-gray-300 text-sm">Title</label>
        <Input
          placeholder="Brief summary of your experience"
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          {...register("title")}
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <div className="space-y-2">
          <label className="text-gray-300 text-sm">Overall Rating (0-5)</label>
          <Input
            placeholder="e.g. 4.5"
            type="number" min="0" max="5" step="0.1"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            {...register("rating")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-gray-300 text-sm">Game Variety (0-5)</label>
          <Input
            type="number" min="0" max="5" step="0.1"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            {...register("game_variety_rating")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-gray-300 text-sm">Customer Service (0-5)</label>
          <Input
            type="number" min="0" max="5" step="0.1"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            {...register("customer_service_rating")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-gray-300 text-sm">Payout Speed (0-5)</label>
          <Input
            type="number" min="0" max="5" step="0.1"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            {...register("payout_speed_rating")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-gray-300 text-sm">Your Review</label>
        <Textarea
          rows={5}
          placeholder="Share helpful details about games, support, payouts, and overall experience"
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          {...register("content")}
        />
        {errors.content && <p className="text-xs text-red-400">{errors.content.message}</p>}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80">
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </form>
  )
}


