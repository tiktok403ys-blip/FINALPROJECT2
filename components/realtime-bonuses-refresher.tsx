"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function RealtimeBonusesRefresher() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("bonuses-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "bonuses"
      }, (payload: { new: any; old: any; eventType: string; table: string }) => {
        console.log("Bonuses real-time update:", payload)
        router.refresh()
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "casinos"
      }, (payload: { new: any; old: any; eventType: string; table: string }) => {
        console.log("Casinos real-time update (affecting bonuses):", payload)
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}

export default RealtimeBonusesRefresher
