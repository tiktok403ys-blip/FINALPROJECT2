"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface HelpfulVoteProps {
  reviewId: string
  helpful: number
  notHelpful: number
}

export function HelpfulVote({ reviewId, helpful, notHelpful }: HelpfulVoteProps) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [vote, setVote] = useState<1 | -1 | 0>(0)
  const [helpfulCount, setHelpfulCount] = useState<number>(helpful || 0)
  const [notHelpfulCount, setNotHelpfulCount] = useState<number>(notHelpful || 0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: any }) => {
      const uid = data.user?.id || null
      setUserId(uid)
      if (!uid) return
      const { data: existing } = await supabase
        .from("player_review_votes")
        .select("vote")
        .eq("review_id", reviewId)
        .eq("user_id", uid)
        .maybeSingle()
      if (existing?.vote === 1) setVote(1)
      else if (existing?.vote === -1) setVote(-1)
      else setVote(0)
    })
  }, [reviewId, supabase])

  const handleVote = async (nextVote: 1 | -1) => {
    if (!userId) {
      alert("Please login to vote")
      return
    }
    if (loading) return
    setLoading(true)
    try {
      if (vote === nextVote) {
        // remove vote
        await supabase.from("player_review_votes").delete().eq("review_id", reviewId).eq("user_id", userId)
        if (nextVote === 1) setHelpfulCount((c) => Math.max(0, c - 1))
        else setNotHelpfulCount((c) => Math.max(0, c - 1))
        setVote(0)
      } else {
        // upsert new vote
        await supabase
          .from("player_review_votes")
          .upsert({ review_id: reviewId, user_id: userId, vote: nextVote }, { onConflict: "review_id,user_id" })
        if (vote === 1) setHelpfulCount((c) => Math.max(0, c - 1))
        if (vote === -1) setNotHelpfulCount((c) => Math.max(0, c - 1))
        if (nextVote === 1) setHelpfulCount((c) => c + 1)
        else setNotHelpfulCount((c) => c + 1)
        setVote(nextVote)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          vote === 1
            ? "text-green-400 border-green-500/40 bg-green-500/10"
            : "text-gray-400 hover:text-green-400 border-transparent hover:border-green-500/20 hover:bg-green-500/10"
        }`}
        onClick={() => handleVote(1)}
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="font-medium">Helpful ({helpfulCount})</span>
      </button>

      <button
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          vote === -1
            ? "text-red-400 border-red-500/40 bg-red-500/10"
            : "text-gray-400 hover:text-red-400 border-transparent hover:border-red-500/20 hover:bg-red-500/10"
        }`}
        onClick={() => handleVote(-1)}
      >
        <ThumbsDown className="w-4 h-4" />
        <span className="font-medium">Not Helpful ({notHelpfulCount})</span>
      </button>
    </div>
  )
}


