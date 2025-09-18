"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DynamicFavicon() {
  const supabase = createClient()
  const [href, setHref] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const fetchActive = async () => {
      const { data } = await supabase
        .from('favicons')
        .select('url')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      if (!active) return
      setHref(data?.url || null)
    }

    fetchActive()

    // Optional realtime update
    const channel = supabase
      .channel('favicons-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favicons' }, () => fetchActive())
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const url = href || '/favicon.ico'
  // Render link tags in the body; a small inline script in the HTML moves them to <head>
  return (
    <>
      <link rel="icon" href={url} />
      <link rel="shortcut icon" href={url} />
    </>
  )
}


