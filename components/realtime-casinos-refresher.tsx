"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function RealtimeCasinosRefresher({ filterHomeFeatured = false }: { filterHomeFeatured?: boolean }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("casinos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "casinos" },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, filterHomeFeatured])

  return null
}

export default RealtimeCasinosRefresher


