import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Star, MapPin, Gift, ExternalLink, Calendar } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Bonus } from "@/lib/types"

interface CasinoDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CasinoDetailPage({ params }: CasinoDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: casino } = await supabase.from("casinos").select("*").eq("id", id).single()

  if (!casino) {
    notFound()
  }

  const { data: bonuses } = await supabase.from("bonuses").select("*").eq("casino_id", id)

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Casino Header */}
          <GlassCard className="p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 bg-[#00ff88]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-12 h-12 text-[#00ff88]" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">{casino.name}</h1>
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(casino.rating || 0) ? "text-[#00ff88] fill-current" : "text-gray-600"
                        }`}
                      />
                    ))}
                    <span className="text-white ml-2 font-semibold">{casino.rating}</span>
                  </div>
                </div>

                {casino.location && (
                  <div className="flex items-center justify-center md:justify-start text-gray-400 mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    {casino.location}
                  </div>
                )}

                <p className="text-gray-400 mb-6">{casino.description}</p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  {casino.website_url && (
                    <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
                      <Link href={casino.website_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Casino
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" asChild>
                    <Link href="/casinos">Back to Casinos</Link>
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Bonus Information */}
          {casino.bonus_info && (
            <GlassCard className="p-6 mb-8">
              <div className="flex items-start">
                <Gift className="w-6 h-6 text-[#00ff88] mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Welcome Bonus</h3>
                  <p className="text-gray-400">{casino.bonus_info}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Available Bonuses */}
          {bonuses && bonuses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Available Bonuses</h2>
              <div className="grid gap-6">
                {bonuses.map((bonus: Bonus) => (
                  <GlassCard key={bonus.id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{bonus.title}</h3>
                        <p className="text-gray-400 mb-2">{bonus.description}</p>
                        {bonus.bonus_amount && <p className="text-[#00ff88] font-semibold">{bonus.bonus_amount}</p>}
                        {bonus.expiry_date && (
                          <div className="flex items-center text-gray-400 text-sm mt-2">
                            <Calendar className="w-4 h-4 mr-1" />
                            Expires: {new Date(bonus.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {bonus.claim_url && (
                        <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80" asChild>
                          <Link href={bonus.claim_url} target="_blank" rel="noopener noreferrer">
                            Claim Bonus
                          </Link>
                        </Button>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Casino Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">License:</span>
                <span className="text-white ml-2">{casino.location || "Not specified"}</span>
              </div>
              <div>
                <span className="text-gray-400">Established:</span>
                <span className="text-white ml-2">{new Date(casino.created_at).getFullYear()}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
