"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"

export function BonusFeedback({ bonusId, yes = 0, no = 0 }: { bonusId: string; yes?: number; no?: number }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [vote, setVote] = useState<1 | -1 | 0>(0)
  const [yesCount, setYesCount] = useState(yes)
  const [noCount, setNoCount] = useState(no)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: any }) => {
      const uid = data.user?.id || null
      setUserId(uid)
      if (!uid) return
      const { data: existing } = await supabase
        .from("bonus_votes")
        .select("vote")
        .eq("bonus_id", bonusId)
        .eq("user_id", uid)
        .maybeSingle()
      if (existing?.vote === 1) setVote(1)
      else if (existing?.vote === -1) setVote(-1)
      else setVote(0)
    })

    const channel = supabase
      .channel(`bonus-votes-${bonusId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bonuses", filter: `id=eq.${bonusId}` },
        (payload: any) => {
          const row = payload?.new
          if (typeof row?.yes_count === "number") setYesCount(row.yes_count)
          if (typeof row?.no_count === "number") setNoCount(row.no_count)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bonusId, supabase])

  const handle = async (next: 1 | -1) => {
    if (!userId) return alert("Please login to vote")
    if (loading) return
    setLoading(true)
    try {
      if (vote === next) {
        await supabase.from("bonus_votes").delete().eq("bonus_id", bonusId).eq("user_id", userId)
        if (next === 1) setYesCount((c) => Math.max(0, c - 1))
        else setNoCount((c) => Math.max(0, c - 1))
        setVote(0)
      } else {
        await supabase
          .from("bonus_votes")
          .upsert({ bonus_id: bonusId, user_id: userId, vote: next }, { onConflict: "bonus_id,user_id" })
        if (vote === 1) setYesCount((c) => Math.max(0, c - 1))
        if (vote === -1) setNoCount((c) => Math.max(0, c - 1))
        if (next === 1) setYesCount((c) => c + 1)
        else setNoCount((c) => c + 1)
        setVote(next)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => handle(1)}
        className={`flex-1 border-green-600 ${vote === 1 ? "text-green-400 bg-green-600/10" : "text-green-400 hover:bg-green-600/10 bg-transparent"}`}
      >
        <ThumbsUp className="w-3 h-3 mr-1" /> Yes ({yesCount})
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => handle(-1)}
        className={`flex-1 border-red-600 ${vote === -1 ? "text-red-400 bg-red-600/10" : "text-red-400 hover:bg-red-600/10 bg-transparent"}`}
      >
        <ThumbsDown className="w-3 h-3 mr-1" /> No ({noCount})
      </Button>
    </div>
  )
}


