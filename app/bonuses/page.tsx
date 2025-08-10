import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Gift, Calendar, ExternalLink, Star } from "lucide-react"
import Link from "next/link"
import type { Bonus } from "@/lib/types"

export default async function BonusesPage() {
  const supabase = await createClient()

  const { data: bonuses } = await supabase
    .from("bonuses")
    .select(`
      *,
      casinos (
        id,
        name,
        rating,
        website_url
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Best Casino Bonuses</h1>
          <p className="text-gray-400 text-lg">Discover exclusive bonuses and promotions from top online casinos</p>
        </div>

        <div className="grid gap-8 max-w-4xl mx-auto">
          {bonuses?.map((bonus: Bonus & { casinos?: any }) => (
            <GlassCard key={bonus.id} className="p-6 hover:scale-[1.02] transition-transform duration-300">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-start mb-4">
                    <Gift className="w-6 h-6 text-[#00ff88] mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{bonus.title}</h3>
                      {bonus.casinos && (
                        <div className="flex items-center mb-2">
                          <span className="text-gray-400 mr-2">at</span>
                          <Link
                            href={`/casinos/${bonus.casinos.id}`}
                            className="text-[#00ff88] hover:underline font-semibold"
                          >
                            {bonus.casinos.name}
                          </Link>
                          {bonus.casinos.rating && (
                            <div className="flex items-center ml-3">
                              <Star className="w-4 h-4 text-[#00ff88] fill-current" />
                              <span className="text-white ml-1 text-sm">{bonus.casinos.rating}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {bonus.description && <p className="text-gray-400">{bonus.description}</p>}

                    {bonus.bonus_amount && (
                      <div className="bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg p-3">
                        <p className="text-[#00ff88] font-bold text-lg">{bonus.bonus_amount}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      {bonus.bonus_type && (
                        <div className="flex items-center text-gray-400">
                          <span className="bg-white/10 px-2 py-1 rounded">{bonus.bonus_type}</span>
                        </div>
                      )}

                      {bonus.expiry_date && (
                        <div className="flex items-center text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          Expires: {new Date(bonus.expiry_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:w-48">
                  {bonus.claim_url && (
                    <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
                      <Link href={bonus.claim_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Claim Bonus
                      </Link>
                    </Button>
                  )}

                  {bonus.casinos?.website_url && (
                    <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
                      <Link href={bonus.casinos.website_url} target="_blank" rel="noopener noreferrer">
                        Visit Casino
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {!bonuses?.length && (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No bonuses available at the moment. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  )
}
