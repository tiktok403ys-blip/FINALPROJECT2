import BonusesClientPage from "./BonusesClientPage"
import RealtimeBonusesRefresher from "@/components/realtime-bonuses-refresher"
import { createClient } from "@/lib/supabase/server"
import type { Bonus, Casino } from "@/lib/types"

export const metadata = {
  title: "Best Casino Bonuses - GuruSingapore",
  description:
    "Discover the best casino bonuses and exclusive offers. Get more value from your casino experience with verified bonus codes.",
}

// Revalidate every hour for bonus offers
export const revalidate = 3600

export default async function BonusesPage() {
  const supabase = await createClient()

  const { data: bonuses } = await supabase
    .from("bonuses")
    .select(`
      *,
      casinos (
        name,
        logo_url,
        rating
      )
    `)
    .order("created_at", { ascending: false })

  // Derive whether each bonus' casino has a published editorial review
  const casinoIds = (bonuses || [])
    .map((b: Bonus) => b.casino_id)
    .filter((id: string | null): id is string => typeof id === "string")

  let bonusesWithFlag = bonuses || []
  if (casinoIds.length > 0) {
    const { data: reviews } = await supabase
      .from("casino_reviews")
      .select("casino_id")
      .in("casino_id", casinoIds)
      .eq("is_published", true)

    const hasReviewSet = new Set((reviews || []).map((r: { casino_id: string }) => r.casino_id))
    bonusesWithFlag = (bonuses || []).map((b: Bonus) => ({ ...b, has_review: hasReviewSet.has(b.casino_id || '') }))
  }

  return (
    <>
      <BonusesClientPage bonuses={bonusesWithFlag as unknown as (Bonus & { casinos?: Casino })[]} />
      <RealtimeBonusesRefresher />
    </>
  )
}
