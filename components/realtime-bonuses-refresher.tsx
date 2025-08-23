"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function RealtimeBonusesRefresher() {
  const router = useRouter()

  useEffect(() => {
    console.log("🎯 Initializing Bonuses Real-time Refresher")

    const supabase = createClient()
    const channel = supabase
      .channel("bonuses-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "bonuses"
      }, (payload: { new: any; old: any; eventType: string; table: string }) => {
        console.log("🔄 Bonuses real-time update received:", {
          eventType: payload.eventType,
          table: payload.table,
          hasNewData: !!payload.new,
          hasOldData: !!payload.old,
          timestamp: new Date().toISOString()
        })
        router.refresh()
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "casinos"
      }, (payload: { new: any; old: any; eventType: string; table: string }) => {
        console.log("🔄 Casinos real-time update (affecting bonuses):", {
          eventType: payload.eventType,
          table: payload.table,
          hasNewData: !!payload.new,
          hasOldData: !!payload.old,
          timestamp: new Date().toISOString()
        })
        router.refresh()
      })
      .subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => {
        console.log("📡 Bonuses real-time subscription status:", status)
        if (status === 'SUBSCRIBED') {
          console.log("✅ Bonuses real-time successfully connected")
        } else if (status === 'CHANNEL_ERROR') {
          console.error("❌ Bonuses real-time connection error")
        }
      })

    return () => {
      console.log("🔌 Cleaning up Bonuses real-time subscription")
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}

export default RealtimeBonusesRefresher
