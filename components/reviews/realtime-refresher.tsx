"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function ReviewsRealtimeRefresher({ casinoId }: { casinoId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("reviews-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_reviews", filter: `casino_id=eq.${casinoId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_review_votes" },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [casinoId, router])

  return null
}


