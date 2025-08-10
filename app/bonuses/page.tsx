import BonusesClientPage from "./BonusesClientPage"
import { createClient } from "@/lib/supabase/server"
import type { Bonus, Casino } from "@/lib/types"

export const metadata = {
  title: "Best Casino Bonuses - GuruSingapore",
  description:
    "Discover the best casino bonuses and exclusive offers. Get more value from your casino experience with verified bonus codes.",
}

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

  return <BonusesClientPage bonuses={bonuses as (Bonus & { casinos?: Casino })[]} />
}
