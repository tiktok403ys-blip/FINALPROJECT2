"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function RealtimeHomeRefresher() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "page_sections" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "bonuses" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "casinos" }, () => router.refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}

export default RealtimeHomeRefresher


