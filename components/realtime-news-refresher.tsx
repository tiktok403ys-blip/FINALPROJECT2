"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function RealtimeNewsRefresher() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("news-articles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "news_articles" }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [router])

  return null
}


